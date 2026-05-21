import { redirect } from "next/navigation"

export default async function JournalPage(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  redirect(`/${countryCode}/blog`)
}
