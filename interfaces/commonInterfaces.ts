import ApiResponse from "@/lib/api";

export interface IPresignedData {
	fileFormat: string;
}
export interface ICoordinates {
	lat: number;
	lng: number;
}

export interface ISettings {
	id: number;
	name: string;
	value: string;
	created_ts: Date;
}

export interface ApiOptions {
	headers: { [key: string]: string };
	// You can add more options here if needed
}
export interface IOptions {
	id?: string | number;
	name?: string;
	value?: string | number;
	_id?: string;
}
export interface IAddress {
	addressLine1?: string;
	zip?: string | undefined;
	address?: string;
	city?: string;
	state?: string;
	stateCode?: string;
	country?: string;
	countryCode?: string;
	lat?: number;
	lng?: number;
}
export interface IUseAutoCompleteAddress {
	predictions: any[];
	addressDetails?: IAddress;
	handlePlaceSelection: (data: any) => void;
}

export interface ILogin {
	email: string;
	password: string;
	account_type?: string;
}
export interface Imeta {
	previousId: number;
	nextId: number;
	total: number;
}
export interface IInfiniteScrollParams {
	offset?: number;
	prevOffset?: number;
	hasMore?: boolean;
}
export interface IUseInfiniteScrollParams<P> extends IInfiniteScrollParams {
	apiService: (params: P) => Promise<ApiResponse>;
	apiParams?: { [key: string]: unknown };
	limit?: number;
}
export interface IUseInfiniteScrollReturn<D> {
	data: D[];
	hasMore: boolean;
	loading: boolean;
	apiResponse?: ApiResponse;
	setLoading: (flag: boolean) => void;
	loadMore: (event?: any) => void;
	setData: (data: D[]) => void;
	fetchData: (firstLoad?: boolean) => void;
}

export interface ICommonDataForApi {
	offset?: number;
	search_text?: string;
	limit?: number;
	type?: number;
}
export interface IUserFilter {
	startDate?: Date;
	endDate?: Date;
}
export interface IGamingHistory {
	wallet_transactions_id: number;
	wallet_transactions_type: string;
	wallet_transactions_amount: string;
	wallet_transactions_balance: string;
	wallet_transactions_transaction_id: string;
	wallet_transactions_remark: string;
	wallet_transactions_is_game_transaction: boolean;
	wallet_transactions_updated_ts: string;
	wallet_transactions_wallet_id: number;
	gameName: string;
	wallets_id: number;
	wallets_type: string;
	wallets_balance: string;
	wallets_with_hold_amount: string;
	wallets_updated_ts: string;
}

export interface ISimilarGamesParams extends ICommonDataForApi {
	categoryId: number;
	gameId: number;
}

export interface IFacebookLogin {
	password: string;
	email?: string;
	name?: string;
	user_name: string;
	access_token: string;
	userId: string;
	first_name: string;
	last_name: string;
	dob: string;
}
export interface IFacebookRes {
	name: string;
	email: string;
	id: string;
	accessToken: string;
	userID: string;
	expiresIn: number;
	signedRequest: string;
	graphDomain: string;
}

export interface ISessionData {
	expires: string;
	authToken: string;
}
