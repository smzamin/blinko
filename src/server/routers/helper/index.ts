import axios from "axios"

import { getGlobalConfig } from "../config"

export const SendWebhook = async (data: any, webhookType: string, ctx: { id: string }) => {
  try {
    const globalConfig = await getGlobalConfig(ctx)
    if (globalConfig.webhookEndpoint) {
      await axios.post(globalConfig.webhookEndpoint, { data, webhookType, activityType: `blinko.note.${webhookType}` })
    }
  } catch (error) {
    console.log('request webhook error:', error)
  }
}