import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/page-header"
import { useAuthStore } from "@/lib/stores/auth-store"
import { ProfileTab } from "@/pages/settings/profile-tab"
import { SecurityTab } from "@/pages/settings/security-tab"
import { ConnectionsTab } from "@/pages/settings/connections-tab"
import { PreferencesTab } from "@/pages/settings/preferences-tab"

export function SettingsPage() {
  const user = useAuthStore((s) => s.user)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paramètres"
        description="Gérez votre compte, vos connexions OAuth2 et vos préférences culinaires."
      />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
          <TabsTrigger value="connections">Connexions</TabsTrigger>
          <TabsTrigger value="preferences">Préférences culinaires</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="pt-4">
          <ProfileTab key={user.id} />
        </TabsContent>
        <TabsContent value="security" className="pt-4">
          <SecurityTab />
        </TabsContent>
        <TabsContent value="connections" className="pt-4">
          <ConnectionsTab />
        </TabsContent>
        <TabsContent value="preferences" className="pt-4">
          <PreferencesTab key={user.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
