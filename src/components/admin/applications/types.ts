import type { Application } from "@/lib/schemas/auth";

export interface ApplicationManagementTranslations {
  title: string;
  subtitle: string;
  add_app: string;
  new_app: string;
  edit_app: string;
  delete_confirm: string;
  no_apps: string;
  form: {
    name: string;
    description: string;
    redirect_uris: string;
    client_id: string;
    client_secret: string;
    hover_reveal: string;
    placeholder_name: string;
    placeholder_description: string;
    placeholder_uri: string;
    save: string;
    cancel: string;
  };
  cards: {
    active: string;
    inactive: string;
    client_credentials: string;
    authorized_uris: string;
  };
}

export type IndustrialApplicationDisplay = Application & { _id: string };
export type IndustrialApplicationFormValues = Omit<Application, '_id' | 'createdAt' | 'updatedAt'>;

export type ApplicationSubmitHandler = (data: IndustrialApplicationFormValues) => Promise<void>;
