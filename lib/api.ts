import { AxiosResponse } from "axios";

export interface StringKeyObject {
	[key: string]: any;
}

export type TApiState = Record<string, any> | null;

export default interface ApiResponse<T = any>
	extends Partial<AxiosResponse<T | TApiState>> {
	data: TApiState;
	error: TApiState;
}


const { toString } = Object.prototype;

export const isObject = <T>(arg: T): boolean =>
	toString.call(arg) === "[object Object]";

export const withError = <T extends TApiState>(arg: T): ApiResponse => {
	if (isObject(arg)) {
		return {
			data: null,
			error: {
				...arg,
			},
		};
	}

	return {
		data: null,
		error: {
			message: arg,
		},
	};
};

export const withData = <T extends TApiState>(data: T): ApiResponse => ({
	error: null,
	data,
});
