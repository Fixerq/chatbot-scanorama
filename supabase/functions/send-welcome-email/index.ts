
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-application-name",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

interface WelcomeEmailRequest {
  email: string;
  firstName: string;
  lastName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Received welcome email request");
    const { email, firstName, lastName }: WelcomeEmailRequest = await req.json();

    if (!email) {
      console.error("No email provided");
      throw new Error("Email is required");
    }

    console.log("Sending welcome email to:", email);

    const emailResponse = await resend.emails.send({
      from: "Engage AI Pro <support@engageai.pro>",
      to: [email],
      subject: "Welcome to Engage AI Pro!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to Engage AI Pro, ${firstName}!</h2>
          <p>Thank you for joining Engage AI Pro. We're excited to have you on board!</p>
          <p>You can now log in to your account and start using our services.</p>
          <p>If you have any questions or need assistance, don't hesitate to reach out to our support team.</p>
          <p>Best regards,<br>The Engage AI Pro Team</p>
        </div>
      `,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Failed to send welcome email. Please contact support."
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
