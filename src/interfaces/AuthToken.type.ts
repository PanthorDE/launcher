type AuthTokenValidation =
  | {
      status: 'Success';
      name: string;
      requested_at: number;
    }
  | { status: 'Error'; requested_at: number };

export default AuthTokenValidation;
