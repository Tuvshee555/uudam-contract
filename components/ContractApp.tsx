"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  defaultContractData,
  defaultSettings,
  type ContractData,
  type ContractRecord,
  type ContractSettings,
  type ConsentChoice
} from "@/lib/types";

type FieldName = keyof ContractData;

const fieldGroups: Array<{ title: string; fields: Array<{ name: FieldName; label: string }> }> = [
  {
    title: "Гэрээний эхлэл",
    fields: [
      { name: "contractYear", label: "Он" },
      { name: "contractMonth", label: "Сар" },
      { name: "contractDay", label: "Өдөр" },
      { name: "contractNumberSuffix", label: "Гэрээний дугаарын төгсгөл" },
      { name: "touristName", label: "Жуулчны нэр" }
    ]
  },
  {
    title: "Аяллын мэдээлэл",
    fields: [
      { name: "tripDestination", label: "Аяллын чиглэл" },
      { name: "tripYear", label: "Аяллын он" },
      { name: "tripMonth", label: "Аяллын сар" },
      { name: "tripDay", label: "Аяллын өдөр" },
      { name: "duration", label: "Хугацаа" }
    ]
  },
  {
    title: "Гэрээний хугацаа",
    fields: [
      { name: "startYear", label: "Эхлэх он" },
      { name: "startMonth", label: "Эхлэх сар" },
      { name: "startDay", label: "Эхлэх өдөр" },
      { name: "endYear", label: "Дуусах он" },
      { name: "endMonth", label: "Дуусах сар" },
      { name: "endDay", label: "Дуусах өдөр" }
    ]
  },
  {
    title: "Төлбөр",
    fields: [
      { name: "adultCount", label: "Том хүний тоо" },
      { name: "adultPrice", label: "Том хүний үнэ" },
      { name: "childCount", label: "Хүүхдийн тоо" },
      { name: "childPrice", label: "Хүүхдийн үнэ" },
      { name: "totalPrice", label: "Нийт төлөх дүн" }
    ]
  },
  {
    title: "Жуулчны баталгаажуулалт",
    fields: [
      { name: "travelerFullName", label: "Овог нэр" },
      { name: "travelerRegister", label: "Регистрийн дугаар" },
      { name: "travelerAddress", label: "Хаяг" },
      { name: "travelerPhone", label: "Утас" },
      { name: "travelerSignatureText", label: "Гарын үсгийн тайлбар" }
    ]
  }
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("mn-MN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function titleFromData(data: ContractData) {
  const name = data.touristName || data.travelerFullName || "Нэргүй гэрээ";
  const date = [data.contractYear, data.contractMonth, data.contractDay].filter(Boolean).join(".");
  return date ? `${name} - ${date}` : name;
}

function InlineField({
  value,
  placeholder,
  min = 52,
  className = "",
  wide = false,
  multiline = false,
  onChange
}: {
  value: string;
  placeholder: string;
  min?: number;
  className?: string;
  wide?: boolean;
  multiline?: boolean;
  onChange: (value: string) => void;
}) {
  const isFilled = value.trim().length > 0;
  const charCount = Array.from(value.trim()).length;
  const filledWidth = `${Math.min(Math.max(charCount + 1, 2), multiline || wide ? 34 : 18)}ch`;
  const fieldStyle = {
    "--empty-width": `${min}px`,
    "--filled-width": filledWidth
  } as CSSProperties;
  const classes = `inline-field ${isFilled ? "filled" : ""} ${wide ? "wide" : ""} ${className}`;
  const isFixedField = className.includes("fixed");

  if (!isFixedField) {
    return <InlineFlowField className={`${classes} inline-flow-field`} value={value} placeholder={placeholder} style={fieldStyle} onChange={onChange} />;
  }

  return (
    <input
      className={classes}
      value={value}
      placeholder={placeholder}
      style={fieldStyle}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function InlineFlowField({
  className,
  value,
  placeholder,
  style,
  onChange
}: {
  className: string;
  value: string;
  placeholder: string;
  style: CSSProperties;
  onChange: (value: string) => void;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (node.textContent !== value) {
      node.textContent = value;
    }
  }, [value]);

  return (
    <span
      ref={ref}
      className={className}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      role="textbox"
      style={style}
      onInput={(event) => {
        const nextValue = event.currentTarget.textContent?.replace(/[\r\n]+/g, " ") ?? "";
        onChange(nextValue);
      }}
    />
  );
}

function TextField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${node.scrollHeight}px`;
  }, [value]);

  return (
    <label className="field-control">
      {label}
      <textarea
        ref={ref}
        className="field-textarea"
        rows={1}
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\n/g, " "))}
        onInput={(event) => {
          event.currentTarget.style.height = "auto";
          event.currentTarget.style.height = `${event.currentTarget.scrollHeight}px`;
        }}
      />
    </label>
  );
}

function LayeredMarks({ settings }: { settings: ContractSettings }) {
  const signatureSrc = settings.organizerSignatureImage || "/signature.png";
  const stampSrc = settings.organizerStampImage || "/stamp.png";
  return (
    <span className="mark-stack" aria-label="Байгууллагын гарын үсэг, тамга">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="signature-mark" src={signatureSrc} alt="Гарын үсэг" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="stamp-mark" src={stampSrc} alt="Тамга, тэмдэг" />
    </span>
  );
}

export default function ContractApp() {
  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [currentId, setCurrentId] = useState<string | undefined>();
  const [data, setData] = useState<ContractData>(defaultContractData);
  const [customTitle, setCustomTitle] = useState("");
  const [settings, setSettings] = useState<ContractSettings>(defaultSettings);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Шинэ гэрээний загвар бэлэн.");
  const [loading, setLoading] = useState(false);

  const fallbackTitle = useMemo(() => titleFromData(data), [data]);
  const contractTitle = customTitle.trim() || fallbackTitle;

  function update(name: FieldName, value: string) {
    setData((current) => ({ ...current, [name]: value }));
  }

  function updateConsent(value: ConsentChoice) {
    setData((current) => ({ ...current, socialConsent: value }));
  }

  const api = useCallback(async function api<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, init);
    if (response.status === 401) {
      window.location.href = "/login";
      throw new Error("Нэвтрэх шаардлагатай.");
    }
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error ?? "Үйлдэл амжилтгүй боллоо.");
    }
    return response.json() as Promise<T>;
  }, []);

  const loadContracts = useCallback(async function loadContracts(query = "") {
    const body = await api<{ contracts: ContractRecord[] }>(`/api/contracts?q=${encodeURIComponent(query)}`);
    setContracts(body.contracts);
  }, [api]);

  useEffect(() => {
    void (async () => {
      try {
        await api<{ ok: true }>("/api/session", { method: "POST" });
        const [listBody, settingsBody] = await Promise.all([
          api<{ contracts: ContractRecord[] }>("/api/contracts"),
          api<{ settings: ContractSettings }>("/api/settings")
        ]);
        setContracts(listBody.contracts);
        setSettings(settingsBody.settings);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Ачааллах боломжгүй байна.");
      }
    })();
  }, [api]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadContracts(search).catch((error) => setStatus(error.message));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [loadContracts, search]);

  async function save() {
    setLoading(true);
    setStatus("Хадгалж байна...");
    try {
      const body = await api<{ contract: ContractRecord }>("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: currentId, title: contractTitle, data })
      });
      setCurrentId(body.contract.id);
      setCustomTitle(body.contract.title);
      setData(body.contract.data);
      await loadContracts(search);
      setStatus("Гэрээ хадгалагдлаа.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Хадгалах боломжгүй байна.");
    } finally {
      setLoading(false);
    }
  }

  function startNew() {
    setCurrentId(undefined);
    setCustomTitle("");
    setData(defaultContractData);
    setStatus("Шинэ гэрээний загвар нээгдлээ.");
  }

  function openContract(contract: ContractRecord) {
    setCurrentId(contract.id);
    setCustomTitle(contract.title);
    setData({ ...defaultContractData, ...contract.data });
    setStatus("Хадгалсан гэрээ нээгдлээ.");
  }

  async function removeContract(id: string) {
    if (!window.confirm("Энэ гэрээг устгах уу?")) return;
    try {
      await api<{ ok: true }>(`/api/contracts/${id}`, { method: "DELETE" });
      if (currentId === id) startNew();
      await loadContracts(search);
      setStatus("Гэрээ устгагдлаа.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Устгах боломжгүй байна.");
    }
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  function downloadPdf() {
    setStatus("PDF хадгалах цонх нээгдэнэ. Хэвлэх цонхноос PDF хэлбэрээр хадгална уу.");
    window.print();
  }

  async function shareContract() {
    const text = `${contractTitle}\nГэрээний дугаар: Х-26-1-${data.contractNumberSuffix || ""}`;
    if (navigator.share) {
      await navigator.share({ title: contractTitle, text }).catch(() => undefined);
      return;
    }
    window.location.href = `mailto:?subject=${encodeURIComponent(contractTitle)}&body=${encodeURIComponent(text)}`;
  }

  async function readImage(file: File, key: keyof ContractSettings) {
    if (file.size > 900_000) {
      setStatus("Зургийн хэмжээ 900KB-аас бага байх шаардлагатай.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const next = { ...settings, [key]: String(reader.result) };
      setSettings(next);
      await api<{ settings: ContractSettings }>("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next)
      });
      setStatus("Гарын үсэг, тамганы тохиргоо хадгалагдлаа.");
    };
    reader.readAsDataURL(file);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar no-print">
        <div className="brand">
          <p>Уудам Тэс Магнай ХХК</p>
          <h1>Гэрээ</h1>
        </div>
        <button className="primary" onClick={startNew}>
          Шинэ гэрээ
        </button>
        <label className="search-box">
          Хайлт
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Нэр, дугаар, утас..." />
        </label>
        <div className="history-list">
          {contracts.length ? (
            contracts.map((contract) => (
              <article className={contract.id === currentId ? "history-item active" : "history-item"} key={contract.id}>
                <button onClick={() => openContract(contract)}>
                  <strong>{contract.title}</strong>
                  <span>{contract.contractNumber}</span>
                  <small>{formatDate(contract.updatedAt)}</small>
                </button>
                <button className="delete" onClick={() => removeContract(contract.id)} aria-label="Устгах">
                  ×
                </button>
              </article>
            ))
          ) : (
            <p className="empty-state">Хадгалсан гэрээ алга.</p>
          )}
        </div>
        <button className="ghost" onClick={logout}>
          Гарах
        </button>
      </aside>

      <section className="workspace">
        <header className="topbar no-print">
          <div className="topbar-title">
            <label className="title-control">
              <span>Гэрээний нэр</span>
              <input value={customTitle} onChange={(event) => setCustomTitle(event.target.value)} placeholder={fallbackTitle} />
            </label>
            <span>{status}</span>
          </div>
          <div className="actions">
            <button onClick={save} disabled={loading}>
              {loading ? "Хадгалж байна..." : "Хадгалах"}
            </button>
            <button onClick={downloadPdf}>PDF татах</button>
            <button onClick={shareContract}>Илгээх</button>
          </div>
        </header>

        <div className="editor-layout">
          <section className="form-panel no-print">
            {fieldGroups.map((group) => (
              <div className="form-group" key={group.title}>
                <h3>{group.title}</h3>
                <div className="field-grid">
                  {group.fields.map((field) => (
                    <TextField
                      key={field.name}
                      label={field.label}
                      value={String(data[field.name])}
                      onChange={(value) => update(field.name, value)}
                    />
                  ))}
                </div>
              </div>
            ))}
            <div className="form-group">
              <h3>Сошиал зөвшөөрөл</h3>
              <div className="segmented">
                <button className={data.socialConsent === "yes" ? "selected" : ""} onClick={() => updateConsent("yes")}>
                  Зөвшөөрнө
                </button>
                <button className={data.socialConsent === "no" ? "selected" : ""} onClick={() => updateConsent("no")}>
                  Зөвшөөрөхгүй
                </button>
              </div>
            </div>
            <div className="form-group">
              <h3>Үндсэн гарын үсэг, тамга</h3>
              <label className="file-control">
                Байгууллагын гарын үсэг
                <input type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && readImage(event.target.files[0], "organizerSignatureImage")} />
              </label>
              <label className="file-control">
                Тамга, тэмдэг
                <input type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && readImage(event.target.files[0], "organizerStampImage")} />
              </label>
            </div>
          </section>

          <section className="document-area">
            <ContractDocument data={data} settings={settings} update={update} updateConsent={updateConsent} />
          </section>
        </div>
      </section>
    </main>
  );
}

function ContractDocument({
  data,
  settings,
  update,
  updateConsent
}: {
  data: ContractData;
  settings: ContractSettings;
  update: (name: FieldName, value: string) => void;
  updateConsent: (value: ConsentChoice) => void;
}) {
  return (
    <div className="print-stack">
      <article className="contract-page">
        <h1>АЯЛАЛ ЖУУЛЧЛАЛЫН ГЭРЭЭ</h1>
        <div className="meta-line">
          <div className="meta-date">
            <InlineField value={data.contractYear} placeholder="он" min={54} className="fixed short" onChange={(v) => update("contractYear", v)} />
            <span>оны</span>
            <InlineField value={data.contractMonth} placeholder="сар" min={44} className="fixed short" onChange={(v) => update("contractMonth", v)} />
            <span>сар</span>
            <InlineField value={data.contractDay} placeholder="өдөр" min={44} className="fixed short" onChange={(v) => update("contractDay", v)} />
            <span>өдөр</span>
          </div>
          <div className="meta-number">
            <span>№ Х-26-1-</span>
            <InlineField value={data.contractNumberSuffix} placeholder="..." min={92} className="fixed contract-no" onChange={(v) => update("contractNumberSuffix", v)} />
          </div>
          <div className="meta-city">Улаанбаатар хот</div>
        </div>
        <p>
          Энэхүү <strong>АЯЛАЛ ЖУУЛЧЛАЛЫН ГЭРЭЭ</strong>(цаашид “Гэрээ” гэх)-г нэг талаас Монгол Улсын хуулийн дагуу байгуулагдсан
          Уудам Тэс Магнай ХХК, РД: 7225689 (цаашид “Жуулчлал зохион байгуулагч” гэх) түүнийг төлөөлж
          <strong> Балжиннямын Өнөрбат </strong>(Регистрийн дугаар <strong>ЦГ75080301</strong>) нөгөө талаас{" "}
          <InlineField value={data.touristName} placeholder="Жуулчны нэр" min={230} wide multiline onChange={(v) => update("touristName", v)} />{" "}
          (цаашид “Жуулчин” гэх (хамтад нь “Талууд” гэх) нар Монгол улсын Иргэний хуулийн 370 дугаар зүйл, Аялал жуулчлалын тухай хууль
          болон бусад холбогдох хууль тогтоомж, дүрэм, журмыг удирдлага болгон дараах нөхцөлийг харилцан тохиролцон байгуулав.
        </p>
        <h2>1. Нийтлэг заалт</h2>
        <p>
          1.1 Энэхүү гэрээгээр Жуулчлал зохион байгуулагч нь жуулчинд хэлэлцэн тохирсон дараах БНХАУ,{" "}
          <InlineField value={data.tripDestination} placeholder="аяллын чиглэл" min={120} wide multiline onChange={(v) => update("tripDestination", v)} />{" "}
          аялал - <InlineField value={data.tripYear} placeholder="он" min={44} onChange={(v) => update("tripYear", v)} />-
          <InlineField value={data.tripMonth} placeholder="сар" min={38} onChange={(v) => update("tripMonth", v)} /> сарын{" "}
          <InlineField value={data.tripDay} placeholder="өдөр" min={44} onChange={(v) => update("tripDay", v)} /> үйлчилгээг үзүүлэх,
          Жуулчин нь үйлчилгээний үнэ төлбөрийг төлөх, талуудын эдлэх эрх, хүлээх үүрэг хариуцлагатай холбоотой харилцааг зохицуулна.
        </p>
        <p>1.2 Энэхүү гэрээгээр зохицуулагдаагүй харилцааг Монгол Улсын Иргэний хууль болон холбогдох бусад хууль тогтоомжоор зохицуулна.</p>
        <h2>2. Гэрээний хугацаа</h2>
        <p>
          2.1 Энэхүү Гэрээ нь <InlineField value={data.startYear} placeholder="он" min={44} onChange={(v) => update("startYear", v)} /> оны{" "}
          <InlineField value={data.startMonth} placeholder="сар" min={38} onChange={(v) => update("startMonth", v)} /> дүгээр сарын{" "}
          <InlineField value={data.startDay} placeholder="өдөр" min={44} onChange={(v) => update("startDay", v)} />-ний өдрөөс{" "}
          <InlineField value={data.endYear} placeholder="он" min={44} onChange={(v) => update("endYear", v)} /> оны{" "}
          <InlineField value={data.endMonth} placeholder="сар" min={38} onChange={(v) => update("endMonth", v)} /> дугаар сарын{" "}
          <InlineField value={data.endDay} placeholder="өдөр" min={44} onChange={(v) => update("endDay", v)} />-ны өдрийг дуустал{" "}
          <InlineField value={data.duration} placeholder="хугацаа" min={72} onChange={(v) => update("duration", v)} /> өдрийн /сарын/ хугацаатай байна.
        </p>
        <p>2.2 Гэнэтийн болон давагдашгүй хүчин зүйлийн шинжтэй нөхцөл байдлын улмаас Жуулчлал зохион байгуулагч нь ажлыг хугацаанд нь гүйцэтгэж чадахгүйд хүрвэл жуулчинд нэн даруй мэдэгдэж жуулчин нь нэмэлт хугацаа тогтоож өгнө.</p>
        <h2>3. Ажил үйлчилгээний төлбөр</h2>
        <p>
          3.16 Жуулчлалын үйлчилгээний нийт төлбөр - <InlineField value={data.adultCount} placeholder="том хүн" min={54} onChange={(v) => update("adultCount", v)} /> том хүн*
          <InlineField value={data.adultPrice} placeholder="төлбөр" min={92} onChange={(v) => update("adultPrice", v)} />₮ +{" "}
          <InlineField value={data.childCount} placeholder="хүүхэд" min={54} onChange={(v) => update("childCount", v)} /> хүүхэд{" "}
          <InlineField value={data.childPrice} placeholder="төлбөр" min={92} onChange={(v) => update("childPrice", v)} /> ₮ НИЙТ ТӨЛӨХ -{" "}
          <InlineField value={data.totalPrice} placeholder="нийт дүн" min={112} onChange={(v) => update("totalPrice", v)} />₮. Аяллын урьдчилгаа төлбөр хүн тус бүр 20-50% төлж, аяллын суудлаа баталгаажуулна. Худалдаа хөгжлийн банк 16000 4000 413143429 Уудам Тэс Магнай ХХК данс руу аяллын төлбөрийг шилжүүлнэ.
        </p>
        <p>3.3 Аяллын урьдчилгаа төлбөр аяллын төрөл, онцлог, хугацаанааас хамаарч өөр өөр байж болно.</p>
        <p>3.4 Аливаа төлбөрийн үлдэгдлийг аялал эхлэхээс багадаа 10 өдрийн өмнө төлж барагдуулна.</p>
        <p>3.5 Аяллын төлбөрийг тоот төгрөгийн дансанд шилжүүлэх буюу бэлнээр төлнө.</p>
        <h2>4. Жуулчлал зохион байгуулагчийн эрх, үүрэг</h2>
        <p>4.1 Жуулчлал зохион байгуулагч нь аяллын онцлог, давуу талыг тусгасан, жуулчлагчийн хэрэгцээ шаардлагад тохирсон аяллын хөтөлбөр, маршрутыг танилцуулж, тус хөтөлбөрийн дагуу аяллыг зохион байгуулна.</p>
        <p>4.2 Аялал жуучлал зохион байгуулагч нь гэрээнд заасан аяллын ач холбогдлыг бууруулах буюу үр ашиггүй болгох аливаа доголдол гаргахгүйгээр аяллыг батлагдсан хөтөлбөрийн дагуу түргэн шуурхай, найдвартай, чанартай зохион байгуулах үүрэгтэй.</p>
        <p>4.3 Жуулчлал зохион байгуулагчаас томилсон аяллын хөтөч нь тухайн групп аяллын ахлагч байна. Аяллын хөтөч нь тухайн аяллыг батлагдсан аяллын хөтөлбөрийн дагуу амжилттай зохион байгуулж, аяллын нийт гишүүдийг мэдээ, мэдээлэл, удирдлага, зохион байгуулалтаар ханган ажиллана.</p>
      </article>

      <article className="contract-page">
        <p>4.4 Жуулчлал зохион байгуулагч нь цаг агаарын болон давагдашгүй хүчин зүйлсийн улмаас үүссэн, үүсэж болох эрсдэлээс сэргийлэх зорилгоор аяллын хөтөлбөрт өөрчлөлт оруулах эрхтэй.</p>
        <p>4.5 Аялагчийн хүсэлтийн дагуу аяллын хөтөлбөрт тусгагдаагүй аливаа үйлчилгээ үзүүлэх, нэмэлт маршрутаар зорчих тохиолдолд нэмэлт төлбөр төлнө.</p>
        <h2>5. Аялагчийн эрх, үүрэг</h2>
        <p>5.1 Аялагч нь батлагдсан аяллын хөтөлбөрийн дагуу үйлчилгээ авна.</p>
        <p>5.2 Аялалд тохирсон хувцас, хувийн бэлтгэлийг сайтар хангасан байна.</p>
        <p>5.3 Эрүүл мэндийн урьдчилсан үзлэгт хамрагдах, эмчийн зөвлөгөө авах гэх мэт бие, физиологийн эрүүл байдлыг хангасан байна.</p>
        <p>5.4 Аяллын хөтчийн тавьсан аяллын үеийн зөвлөмж болон шаардлагыг биелүүлэх үүрэгтэй.</p>
        <p>5.5 Аялагч нь аяллын үнэ болон хөтөлбөрт тусгагдаагүй нэмэлт үйлчилгээ авах тохиолдолд Жуулчлал зохион байгуулагчийн зөвшөөрлийг авах ба аяллын багийн бусад гишүүдийн саналыг харгалзан үзэх бөгөөд нэмэгдэл зардал, тооцоог тухай бүр нь төлнө.</p>
        <p>5.7 Аяллын багийн дотоод уур амьсгалд таатай бус нөлөөлөл үзүүлэх, бусад аялагчдын тав тухыг алдагдуулах, хувийн орон зайд халдах зэрэг зан ааш, ёс суртахуун, үзэл бодол, биеийн аливаа сөрөг үйлдэл гаргахгүй байх.</p>
        <p>5.8 Бага насны хүүхэдтэй аялалд явж байгаа тохиолдолд аяллын хугацаанд хүүхдийн эрүүл мэнд, аюулгүй байдлыг эцэг эх, асран хамгаалагч бүрэн хариуцна.</p>
        <h2>6. Хоёр талын хариуцлага</h2>
        <p>6.1 Талууд гэрээнд заасан үүргээ зөрчвөл гэрээнд заасан эрх, үүргийн дагуу хариуцлага хүлээнэ.</p>
        <p>6.2 Энэхүү гэрээтэй холбоотой маргааныг гэрээнд оролцогч талууд харилцан тохиролцохгүйд хүрвэл Монгол улсын шүүхээр шийдвэрлүүлнэ.</p>
        <p>6.3 Энэхүү гэрээ нь аяллын төлбөр төлөгдсөн өдрөөс эхлэн тухайн аялал дуусах өдөр хүртэл хүчин төгөлдөр үйлчилнэ.</p>
        <p>6.4 Аяллын үеэр санаатай болон санамсаргүй байдлаар учруулсан аливаа хохирлыг газар дээр нь шийдвэрлэж, тухайн хохирлыг барагдуулах үүрэгтэй.</p>
        <p>6.5 Аялагч нь галт тэрэг, автобус болон нислэгийн цагаас хоцрох, бичиг баримтын зөрчил болон эрүүл мэндийн байдлын улмаас цаг хугацаандаа аялалд оролцох боломжгүй болсон тохиолдолд батлагдсан аяллын төлбөрийг буцаан олгохгүй.</p>
        <p>6.6 Гэнэтийн болон давагдашгүй хүчин зүйлийн нөхцөл байдлын улмаас нислэг/аялал цуцлагдсан эсхүл хойшлогдсон тохиолдолд Жуулчлал зохион байгуулагч хариуцлага хүлээхгүй бөгөөд энэхүү хүчин зүйлийн талаар аялагч нарт нэн даруй мэдэгдэнэ. Гэнэтийн болон давагдашгүй хүчин зүйл гэдэгт олон улсын зэрэглэлд багтсан хүн, малын гоц халдварт өвчин, газар хөдлөлт, хүчтэй аадар бороо, үер, хүчтэй цас болон шороон шуурга зэрэг байгалийн гамшиг, улс хоорондын буюу иргэний дайн зэрэг багтана. Жуулчлал зохион байгуулагчаас үл шалтгаалах нөхцөл байдлаас болоод гэрээ хэрэгжихгүй болсон тохиолдолд хууль тогтоомжийн дагуу шийднэ.</p>
      </article>

      <article className="contract-page">
        <p>6.8 Даатгалын нөхөн төлбөр тооцогдох аливаа нөхцөл үүссэн тохиолдолд холбогдох нөхөн төлбөрийг даатгалын компанид хандаж шийдүүлнэ. Даатгалын нөхөн төлбөр нэхэмжлэх шаардлагатай нөхцөл үүссэн тохиолдолд аялагч тухайн цаг үеийн бодит нөхцөлийг батлах нотлох баримт, төлбөр төлсөн баримт зэргийг цаг алдалгүй бүрдүүлж, аяллын компани болон даатгалын компанид цаг тухай бүрд нь мэдэгдсэнээр нөхөн төлбөр нэхэмжлэх нөхцөл үүснэ.</p>
        <p>6.9 Аялал эхлэхээс 30-с дээш хоногийн дотор аялагчийн санаачлагчаар аяллыг цуцлах тохиолдолд аяллын төлбөрийг 80%-ийг буцааж олгоно.</p>
        <p>6.10 Аялал эхлэхээс 15-29 хоногийн дотор аялагчийн санаачлагчаар аяллыг цуцлах тохиолдолд аяллын төлбөрийн 50%-ийг буцааж олгоно.</p>
        <p>6.11 Аялал эхлэхээс 7-14 хоногийн дотор аялагчийн санаачлагчаар аяллыг цуцлах тохиолдолд аяллын төлбөрийн 30%-ийг буцааж олгоно.</p>
        <p>6.12 Аялал эхлэхээс 0-6 хоногийн дотор аялагчийн санаачлагчаар аяллыг цуцлах тохиолдолд аяллын төлбөр (Хөтөлбөртэй групп аяллын онгоцны тийз, зочид буудлын захиалгын төлбөр буцаалтгүй тарифтай байдгаас шаалтгаална) буцаагдахгүй.</p>
        <h2>7. Гэрээний баталгаажилт</h2>
        <p>Аяллын урьдчилгаа болон бүтэн төлбөр төлөгдсөн өдрөөс эхлэн энэхүү гэрээ нь баталгаажиж, хүчин төгөлдөр үйлчилж эхэлнэ.</p>
        <h2>8. Хувийн мэдээллийг олон нийтийн сүлжээнд ашиглах</h2>
        <p>Аялал жуулчлал зохион байгуулагч нь байгууллагын дотоод хэрэгцээ болон зар сурталчилгаа, маркетингийн зорилгоор аялагчийн буюу хувь хүний мэдээлэл (овог нэр, нүүр царай тод гарсан фото зураг, видео бичлэг, аялахаар төлөвлөсөн болон аялж буй, аялаад ирсэн маршрутыг илэрхийлсэн пост, нийтлэл)-ийг олон нийтийн сүлжээнд ашиглах тохиолдолд энэхүү гэрээнд доор тусгасан байдлаар аялагчийн баталгаажуулсан зөвшөөрлийг баримтална.</p>
        <p className="consent-question">Таны хувийн мэдээллийг олон нийтийн сүлжээнд нийтлэхийг зөвшөөрч байна уу?</p>
        <div className="consent-options">
          <button className={data.socialConsent === "yes" ? "checked" : ""} onClick={() => updateConsent("yes")}>Зөвшөөрнө</button>
          <button className={data.socialConsent === "no" ? "checked" : ""} onClick={() => updateConsent("no")}>Зөвшөөрөхгүй</button>
        </div>
        <h2 className="signed-title">Гэрээ байгуулсан:</h2>
        <div className="signature-grid">
          <section>
            <h3>Жуулчин:</h3>
            <p>Овог нэр: <InlineField value={data.travelerFullName} placeholder="овог нэр" min={190} wide multiline onChange={(v) => update("travelerFullName", v)} /></p>
            <p>Регистрийн дугаар: <InlineField value={data.travelerRegister} placeholder="регистр" min={150} onChange={(v) => update("travelerRegister", v)} /></p>
            <p>Хаяг: <InlineField value={data.travelerAddress} placeholder="хаяг" min={240} wide multiline onChange={(v) => update("travelerAddress", v)} /></p>
            <p>Утас: <InlineField value={data.travelerPhone} placeholder="утас" min={150} onChange={(v) => update("travelerPhone", v)} /></p>
            <p>Гарын үсэг: <InlineField value={data.travelerSignatureText} placeholder="" min={180} onChange={(v) => update("travelerSignatureText", v)} /></p>
            <p>(Тамга, тэмдэг)</p>
          </section>
          <section>
            <h3>Жуулчлал зохион байгуулагч:</h3>
            <p>Овог нэр: <span className="printed-line">Балжинням овогтой Өнөрбат</span></p>
            <p>Регистрийн дугаар: <span className="printed-line small-line">ЦГ75080301</span></p>
            <p>Хаяг: <span className="printed-line">Сүхбаатар дүүрэг, 1-р хороо, Оюунлаг төвийн 5 давхарт 502 тоот</span></p>
            <p>Утас: <span className="printed-line">77136633, 89136633, 91172769</span></p>
            <div className="default-assets">
              <span>Гарын үсэг:</span>
              <LayeredMarks settings={settings} />
              <span className="stamp-label">(Тамга, тэмдэг)</span>
            </div>
          </section>
        </div>
      </article>
    </div>
  );
}
