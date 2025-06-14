const URL = process.env.NEXT_PUBLIC_API_URL;

export default {
  auth: {
    LOGIN: `${URL}/auth/login`,
    SIGNUP: `${URL}/auth/signup`,
    FORGOTPASSWORD: `${URL}/auth/forgot-password`,
    RESENDOTP: `${URL}/auth/resend-otp`,
    VERIFYOTP: `${URL}/auth/verify-otp`,
    RESETPASSWORD: `${URL}/auth/reset-password`,
    CHECK_EMAIL: `${URL}/auth/check-email`,
    SOCIAL_LOGIN: `${URL}/auth/social-login`,
    VERIFYPASSCODE: `${URL}/auth/verify-passcode`,
    LOGOUT: `${URL}/auth/logout`,
  },
  user: {
    CHANGE_PASSWORD: `${URL}/user/change-password`,
    PERSONAL_DETAILS: `${URL}/user/personal-details`,
    PHYSIQUEINFO: `${URL}/user/physique-details`,
    HEALTH_HISTORY_INFO: `${URL}/user/healthhistory-details`,
    LIFE_STYLE_INFO: `${URL}/user/lifestyleInfo-detail`,
    PERSONAL_DOCUMENTS: `${URL}/user/personal-documents`,
    UPDATE_PROFILE_IMAGE: `${URL}/user/update-profile-image`,
    GET_PERSONAL_DOCUMENTS: `${URL}/user/get-personal-documents`,
    GET_PLANS: `${URL}/paypal/get-plans`,
    CREATE_SUBSCRIPTION_PLAN: `${URL}/paypal/create-subscription`,
    RECENT_ACTIVITY: `${URL}/user/get-user-details`,
    GET_PRESIGNED_URL: `${URL}/user/get-presigned-url`,
    UPDATE_USER: `${URL}/user/update`,
    GET_USER_LIST: `${URL}/user/list`,
    GET_USER_INFO: `${URL}/user/info`,
  },
};
