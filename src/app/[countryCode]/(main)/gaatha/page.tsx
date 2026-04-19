import { redirect } from "next/navigation"

type Props = {
  params: Promise<{ countryCode: string }>
}

export default async function GaathaPage(props: Props) {
  const { countryCode } = await props.params

  redirect(`/${countryCode}/journal`)
}
