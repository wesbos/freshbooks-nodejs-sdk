/* eslint-disable @typescript-eslint/camelcase */
import Pagination from './Pagination'
import { transformErrorResponse, isProjectErrorResponse, ErrorResponse } from './Error'

import VisState from './VisState'

export default interface Service {
	businessId?: number
	id?: number
	name?: string
	billable?: boolean
	visState?: VisState
}

export function transformServiceResponse(data: string): Service | ErrorResponse {
	const response = JSON.parse(data)
	if (isProjectErrorResponse(response)) {
		return transformErrorResponse(response)
	}

	const { service } = response
	return transformServiceParsedResponse(service)
}

export function transformServiceListResponse(data: string): { services: Service[]; pages: Pagination } | ErrorResponse {
	const response = JSON.parse(data)

	if (isProjectErrorResponse(response)) {
		return transformErrorResponse(response)
	}

	const { services, meta } = response
	const { total, per_page, page, pages } = meta

	return {
		services: services.map((service: Service) => transformServiceParsedResponse(service)),
		pages: {
			total,
			size: per_page,
			pages,
			page,
		},
	}
}

export function transformServiceParsedResponse(service: any): Service {
	return {
		businessId: service.business_id,
		id: service.id,
		name: service.name,
		billable: service.billable,
		visState: service.vis_state,
	}
}

export function transformServiceRequest(service: Service): string {
	return JSON.stringify({
		service: {
			name: service.name,
		},
	})
}
