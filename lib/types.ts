export type ConsentChoice = "yes" | "no" | "";

export type ContractData = {
  contractYear: string;
  contractMonth: string;
  contractDay: string;
  contractNumberSuffix: string;
  touristName: string;
  tripDestination: string;
  tripYear: string;
  tripMonth: string;
  tripDay: string;
  startYear: string;
  startMonth: string;
  startDay: string;
  endYear: string;
  endMonth: string;
  endDay: string;
  duration: string;
  adultCount: string;
  adultPrice: string;
  childCount: string;
  childPrice: string;
  extraCost: string;
  extraCostNote: string;
  totalPrice: string;
  travelerFullName: string;
  travelerRegister: string;
  travelerAddress: string;
  travelerPhone: string;
  travelerSignatureText: string;
  socialConsent: ConsentChoice;
};

export type ContractRecord = {
  id: string;
  title: string;
  contractNumber: string;
  touristName: string;
  data: ContractData;
  createdAt: string;
  updatedAt: string;
};

export type ContractSettings = {
  organizerSignatureImage: string;
  organizerStampImage: string;
};

export const defaultContractData: ContractData = {
  contractYear: "2026",
  contractMonth: "",
  contractDay: "",
  contractNumberSuffix: "",
  touristName: "",
  tripDestination: "",
  tripYear: "2026",
  tripMonth: "",
  tripDay: "",
  startYear: "2026",
  startMonth: "",
  startDay: "",
  endYear: "2026",
  endMonth: "",
  endDay: "",
  duration: "",
  adultCount: "",
  adultPrice: "",
  childCount: "",
  childPrice: "",
  extraCost: "",
  extraCostNote: "",
  totalPrice: "",
  travelerFullName: "",
  travelerRegister: "",
  travelerAddress: "",
  travelerPhone: "",
  travelerSignatureText: "",
  socialConsent: ""
};

export const defaultSettings: ContractSettings = {
  organizerSignatureImage: "",
  organizerStampImage: ""
};
