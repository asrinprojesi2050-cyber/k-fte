import { Role } from "../api/types";

export type AuthStackParamList = {
  RoleSelect: undefined;
  Phone: { role: Role };
  Otp: { role: Role; phone: string };
};

export type CustomerTabParamList = {
  CustomerHome: undefined;
  CreateRequest: { categoryId?: string } | undefined;
  CustomerRequestsStack: undefined;
  MessagesStack: undefined;
  CustomerProfileStack: undefined;
};

export type CustomerRequestsStackParamList = {
  CustomerRequestsList: undefined;
  RequestDetail: { requestId: string };
  JobDetail: { jobId: string };
  ReviewForm: { jobId: string; providerName: string };
};

export type ProviderTabParamList = {
  ProviderHomeStack: undefined;
  MessagesStack: undefined;
  ProviderJobsStack: undefined;
  ProviderProfileStack: undefined;
};

export type ProviderHomeStackParamList = {
  ProviderHomeList: undefined;
  RequestDetail: { requestId: string };
};

export type MessagesStackParamList = {
  ChatList: undefined;
  ChatDetail: { requestId: string; otherName: string };
};

export type ProviderJobsStackParamList = {
  ProviderJobsList: undefined;
  JobDetail: { jobId: string };
};

export type CustomerJobsStackParamList = {
  CustomerJobsList: undefined;
  JobDetail: { jobId: string };
};

export type ReviewStackParamList = {
  ReviewForm: { jobId: string; providerName: string };
};
