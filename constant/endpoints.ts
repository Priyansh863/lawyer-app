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
    GET_USER_CASES: `${URL}/user/cases`,
    GET_RELATED_USERS: `${URL}/users/related`,
    CREATE_CASE: `${URL}/user/CreateCases`,
    GET_CLIENTS_AND_LAWYERS: `${URL}/user/clients-and-lawyers`,
    LAWYERS: `${URL}/users/lawyers`,
    CLIENTS_LIST: `${URL}/users/clients-list`,
  },
  blog: {
    GET_BLOGS: `${URL}/user/blogs`,
    GET_BLOG: `${URL}/user/blogs/`,
    CREATE_BLOG: `${URL}/user/blogs`,
    UPDATE_BLOG: `${URL}/user/blogs/`,
    DELETE_BLOG: `${URL}/user/blogs/`,
    LIKE_BLOG: `${URL}/user/blogs/`,
  },
  question: {
    CREATE_QUESTION: `${URL}/question`,
    GET_QUESTIONS: `${URL}/question`,
    GET_QUESTION_BY_ID: `${URL}/question/`,  // Append question ID to this URL
    SUBMIT_ANSWER: `${URL}/question/answer/`,  // Append question ID to this URL
  },
};
