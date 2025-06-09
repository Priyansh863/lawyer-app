import { getCurrentUser } from "@/lib/auth-utils"

export default async function AIAssistantsHeader() {
  const user = await getCurrentUser()

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">
        {getGreeting()}, {user.name}
      </h1>
      <h2 className="text-xl font-semibold">AI-Assistants</h2>
    </div>
  )
}
