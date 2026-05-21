import { redirect } from "next/navigation"

type Props = {
  params: Promise<{ countryCode: string; slug: string }>
}

export default async function JournalArticleRedirect(props: Props) {
  const { countryCode, slug } = await props.params
  redirect(`/${countryCode}/blog/${slug}`)
}
