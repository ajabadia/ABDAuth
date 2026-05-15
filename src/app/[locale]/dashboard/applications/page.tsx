import { getTranslations } from "next-intl/server";
import { ApplicationManagementContainer } from "@/components/admin/applications/ApplicationManagementContainer";
import type { IndustrialApplicationDisplay } from "@/components/admin/applications/types";

export default async function ApplicationsPage() {
  const t = await getTranslations('dashboard.applications');
  
  // 🛰️ Mock data for initial UI (until API is ready)
  const initialApplications: IndustrialApplicationDisplay[] = [
    {
      _id: "app_1",
      name: "ABDQuiz Federated",
      description: "Official audit and quiz platform satellite.",
      clientId: "8f7e2d1a-4c3b-9a8b-7d6e-5f4a3b2c1d0e",
      clientSecret: "********************************",
      redirectUris: ["https://quiz.abd.com/api/auth/callback/abdauth"],
      active: true,
      createdAt: new Date(),
    }
  ];

  const translations = {
    title: t('title'),
    subtitle: t('subtitle'),
    add_app: t('add_app'),
    new_app: t('new_app'),
    edit_app: t('edit_app'),
    delete_confirm: t('delete_confirm'),
    no_apps: t('no_apps'),
    form: {
      name: t('form.name'),
      description: t('form.description'),
      redirect_uris: t('form.redirect_uris'),
      client_id: t('form.client_id'),
      client_secret: t('form.client_secret'),
      hover_reveal: t('form.hover_reveal'),
      placeholder_name: t('form.placeholder_name'),
      placeholder_description: t('form.placeholder_description'),
      placeholder_uri: t('form.placeholder_uri'),
      add_uri_btn: t('form.add_uri_btn'),
      save: t('form.save'),
      cancel: t('form.cancel'),
    },
    cards: {
      active: t('cards.active'),
      inactive: t('cards.inactive'),
      client_credentials: t('cards.client_credentials'),
      authorized_uris: t('cards.authorized_uris'),
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <ApplicationManagementContainer 
        initialApplications={initialApplications} 
        t={translations} 
      />
    </div>
  );
}
