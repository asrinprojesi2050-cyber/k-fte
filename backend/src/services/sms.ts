export interface SmsProvider {
  send(phone: string, message: string): Promise<void>;
}

class ConsoleSmsProvider implements SmsProvider {
  async send(phone: string, message: string) {
    console.log(`[SMS] To: ${phone} — ${message}`);
  }
}

class TwilioSmsProvider implements SmsProvider {
  private client: any;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!accountSid || !authToken) {
      throw new Error("TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set");
    }
    try {
      // @ts-ignore - twilio is optional, installed only when SMS is configured
      const twilio = require("twilio");
      this.client = twilio(accountSid, authToken);
    } catch {
      throw new Error("twilio package not installed. Run: npm install twilio");
    }
  }

  async send(phone: string, message: string) {
    const from = process.env.TWILIO_PHONE_NUMBER;
    if (!from) throw new Error("TWILIO_PHONE_NUMBER must be set");
    await this.client.messages.create({ from, to: phone, body: message });
  }
}

export function createSmsProvider(): SmsProvider {
  if (process.env.TWILIO_ACCOUNT_SID) {
    return new TwilioSmsProvider();
  }
  return new ConsoleSmsProvider();
}
