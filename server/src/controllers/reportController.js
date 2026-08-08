import {
  getCurrentReport,
  getReportHistory,
} from '../services/reports/reportService.js'
import { sendSuccess } from '../utils/http.js'

export async function currentReport(request, response) {
  return sendSuccess(response, { report: await getCurrentReport(request.user) })
}

export async function reportHistory(request, response) {
  return sendSuccess(response, { reports: await getReportHistory(request.user) })
}
