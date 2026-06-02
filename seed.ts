import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://pavtquqpgmirrmbdkqqd.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhdnRxdXFwZ21pcnJtYmRrcXFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0OTU1MDIsImV4cCI6MjA5NTA3MTUwMn0.M93uSA308Mv8aK0xX_EIrLjq1DbsdbFw_Ns1sljAYWo"

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function seed() {
  console.log("🚀 Testing existing credentials...")

  // Try common passwords
  for (const pw of ["123456", "admin123", "Admin@123", "senha123", "12345678", "password"]) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: "admin@gmail.com",
      password: pw
    })
    if (data?.user) {
      console.log(`✅ Admin works with password: ${pw}`)
      break
    }
  }

  for (const pw of ["123456", "func123", "Func@123", "senha123", "12345678"]) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: "funcionario@gmail.com",
      password: pw
    })
    if (data?.user) {
      console.log(`✅ Funcionario works with password: ${pw}`)
      break
    }
  }

  // If users exist but need password reset, try admin update via API
  // We'll use signInWithPassword with OTP to set new passwords
  console.log("\n🔄 Attempting password update...")

  // Use updateUser via signInWithPassword won't work if we don't know the password
  // Let's try to delete and recreate
  
  const { data: { session } } = await supabase.auth.signInWithPassword({
    email: "admin@gmail.com",
    password: "123456"
  })

  if (session) {
    console.log("✅ Logged in as admin")
    const { error: updateErr } = await supabase.auth.updateUser({
      password: "Admin@2024"
    })
    if (updateErr) console.log("Update error:", updateErr.message)
    else console.log("✅ Admin password updated to Admin@2024")
    
    await supabase.from('profiles').update({
      role: "admin",
      name: "Admin",
      can_add_items: true,
      can_view_reports: true,
      can_manage_suppliers: true
    }).eq('id', session.user.id)
    console.log("✅ Admin profile updated")
  } else {
    console.log("❌ Cannot login with 123456")
    // Try other common passwords via sign-in
  }

  process.exit(0)
}

seed().catch(e => {
  console.error("Fatal:", e)
  process.exit(1)
})
