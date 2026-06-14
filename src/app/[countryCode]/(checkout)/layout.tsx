import MainLayout from "../(main)/layout"

export default function CheckoutLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ countryCode: string }>
}) {
  return <MainLayout params={params}>{children}</MainLayout>
}
