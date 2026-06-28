export async function lookupPincode(pincode: string): Promise<{
  city: string
  district: string
  state: string
} | null> {
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`)
    const data = await res.json()
    if (data[0]?.Status === 'Success') {
      const post = data[0].PostOffice[0]
      return {
        city: post.Division,
        district: post.District,
        state: post.State,
      }
    }
  } catch {}
  return null
}

export async function lookupIfsc(ifsc: string): Promise<{
  bankName: string
  branch: string
  address: string
} | null> {
  try {
    const res = await fetch(`https://ifsc.razorpay.com/${ifsc.toUpperCase()}`)
    if (res.ok) {
      const d = await res.json()
      return {
        bankName: d.BANK,
        branch: d.BRANCH,
        address: d.ADDRESS,
      }
    }
  } catch {}
  return null
}
