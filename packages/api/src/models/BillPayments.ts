/* eslint-disable @typescript-eslint/camelcase */
import { DateFormat, transformDateRequest, transformDateResponse } from './Date'
import { ErrorResponse, isAccountingErrorResponse, transformErrorResponse } from './Error'
import Money, { transformMoneyRequest, transformMoneyResponse } from './Money'
import VisState from './VisState'

enum PaymentType {
	check = 'Check',
	credit = 'Credit',
	cash = 'Cash',
}

export default interface BillPayments {
	id?: number
	amount: Money
	billId: number
	paidDate?: Date
	paymentType?: PaymentType
	note?: string
	visState?: VisState
}

export function transformBillPaymentsData(billPayments: any): BillPayments {
	return {
		id: billPayments.id,
		amount: billPayments.amount && transformMoneyResponse(billPayments.amount),
		billId: billPayments.billid,
		paidDate: billPayments.paid_date && transformDateResponse(billPayments.paid_date, DateFormat['YYYY-MM-DD']),
		paymentType: billPayments.payment_type,
		note: billPayments.note,
		visState: billPayments.vis_state,
	}
}

export function transformBillPaymentsResponse(data: any): BillPayments | ErrorResponse {
	const response = JSON.parse(data)
	if (isAccountingErrorResponse(response)) {
		return transformErrorResponse(response)
	}

	const {
		response: { result },
	} = response

	const { billPayment } = result
	return transformBillPaymentsData(billPayment)
}

export function transformBillPaymentsRequest(billPayment: BillPayments): string {
	return JSON.stringify({
		billPayment: {
			id: billPayment.id,
			amount: transformMoneyRequest(billPayment.amount),
			billid: billPayment.billId,
			paid_date: billPayment.paidDate && transformDateRequest(billPayment.paidDate),
			payment_type: billPayment.paymentType,
			note: billPayment.note,
			vis_state: billPayment.visState,
		},
	})
}
