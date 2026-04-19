import { IconProps } from "types/icon"

const PhonePe = ({ size = "20", color = "#5F259F", ...attributes }: IconProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...attributes}
    >
      <rect x="2" y="2" width="20" height="20" rx="10" fill={color} />
      <path
        d="M9.24 7.75h3.22c2.1 0 3.46 1.11 3.46 2.95 0 1.87-1.36 3.01-3.46 3.01h-1.27v2.54h-1.95V7.75Zm3 4.41c1.09 0 1.74-.49 1.74-1.41 0-.88-.65-1.37-1.74-1.37h-1.05v2.78h1.05Z"
        fill="white"
      />
      <path
        d="M9.43 15.16h5.12"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default PhonePe
