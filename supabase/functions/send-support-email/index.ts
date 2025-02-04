import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const SUPPORT_EMAIL = "support@engageaipro.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  message: string;
  userEmail?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userEmail } = await req.json() as EmailRequest;

    console.log("Sending support email with message:", message);

    const emailResponse = await resend.emails.send({
      from: "Engage AI Pro Support <support@support.engageai.pro>",
      to: [SUPPORT_EMAIL],
      subject: "New Support Request",
      html: `
        <h2>New Support Request</h2>
        <p><strong>From:</strong> ${userEmail || 'Anonymous User'}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
      ...(userEmail && { reply_to: userEmail }),
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-support-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);