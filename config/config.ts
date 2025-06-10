const config = {
	baseUrl: process.env.REACT_APP_BASE_URL,
	cryptoKey: process.env.NEXTCRYPTO_KEY,
	rememberKey: process.env.NEXT_PUBLIC_REMEMBER_KEY,
	markorGameLaunchUrl: process.env.NEXT_PUBLIC_GAME_LAUNCH_URL,
	lobbyUrl: process.env.NEXT_PUBLIC_GAME_LOBBY_URL,
	betSoftDemoGameLaunchUrl:
		process.env.NEXT_PUBLIC_BETSOFT_DEMO_GAME_LAUNCH_URL,
	betSoftRealGameLaunchUrl:
		process.env.NEXT_PUBLIC_BETSOFT_REAL_GAME_LAUNCH_URL,
	betSoftSSCBankId: process.env.NEXT_PUBLIC_BETSOFT_SSC_BANKID,
	betSoftGCCBankId: process.env.NEXT_PUBLIC_BETSOFT_GCC_BANKID,
	cashierUrl: process.env.NEXT_PUBLIC_CASHIER_URL,	
};

export default config;
