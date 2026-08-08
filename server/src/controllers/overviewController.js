import {
  getParentOverview,
  getTeenOverview,
} from '../services/overview/overviewService.js'
import { sendSuccess } from '../utils/http.js'

export async function parentOverview(request, response) {
  return sendSuccess(response, await getParentOverview(request.user))
}

export async function teenOverview(request, response) {
  return sendSuccess(response, await getTeenOverview(request.user))
}
