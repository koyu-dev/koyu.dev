declare module 'github-oauth-popup' {
	export function loginWithGithub(params: {client_id: string, scope: string}): Promise<{code: string}>;
}

declare module 'language-list' {
	class LanguageList {
		getLanguageName(languageCode: string): string;
		getLanguageNames(): string[];
		getLanguageCode(language: string): string;
		getLanguages(): string[];
		getLanguageCodes(): string[];
		getData(): {code: string, name: string}[];
	}
	export default function(): LanguageList;
}

// Extend environment variables
declare namespace NodeJS {
	interface ProcessEnv {
		PARSE_DB_URI: string;
		PARSE_SERVER_URL: string;
		PARSE_SERVER_APPLICATION_ID: string;
		PARSE_SERVER_MASTER_KEY: string;
		PARSE_SERVER_JS_KEY: string;
		PARSE_CLOUD_CODE_MAIN: string;
		PARSE_SERVER_FILE_KEY: string;
	}
}

declare module 'parse-server' {
	export class ParseServer {
		constructor(options: any)
		start(): Promise<void>
		app: any
		static createLiveQueryServer(httpServer: any, options?: any): any
	}	
}

declare module 'parse-dashboard' {
	export default class ParseDashboard {
		constructor(options: any)
	}
}

declare module 'parse-server-firebase-auth-adapter' {

	interface AuthData {
		access_token: string;
		id: string;
	}
	export default class FirebaseAuth {
    constructor()
    validateAuthData(authData: AuthData, options: any): Promise<void>
    validateAppId(): Promise<void>;
	}
}