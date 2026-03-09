import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface VneidTokenResponse {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface VneidUserInfo {
  id: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  identityNumber?: string;
}

@Injectable()
export class VneidService {
  private readonly logger = new Logger(VneidService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly tokenUrl: string;
  private readonly userInfoUrl: string;

  constructor(private readonly config: ConfigService) {
    this.clientId = this.config.get<string>('VNEID_CLIENT_ID', '');
    this.clientSecret = this.config.get<string>('VNEID_CLIENT_SECRET', '');
    this.redirectUri = this.config.get<string>(
      'VNEID_REDIRECT_URI',
      'http://localhost:3001/api/auth/vneid/callback',
    );
    this.tokenUrl = this.config.get<string>(
      'VNEID_TOKEN_URL',
      'https://sso.vneid.vn/oauth2/token',
    );
    this.userInfoUrl = this.config.get<string>(
      'VNEID_USERINFO_URL',
      'https://sso.vneid.vn/oauth2/userinfo',
    );
  }

  /**
   * Trao đổi Authorization Code lấy Access Token từ VNeID
   */
  async exchangeCode(code: string): Promise<VneidTokenResponse> {
    this.logger.log('Exchanging VNeID authorization code...');
    try {
      const response = await axios.post(
        this.tokenUrl,
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.redirectUri,
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );

      return {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in,
        tokenType: response.data.token_type,
      };
    } catch (error) {
      this.logger.error('VNeID token exchange failed', error?.message);
      throw new Error('Failed to exchange VNeID authorization code');
    }
  }

  /**
   * Lấy thông tin người dùng từ VNeID
   */
  async getUserInfo(accessToken: string): Promise<VneidUserInfo> {
    this.logger.log('Fetching VNeID user info...');
    try {
      const response = await axios.get(this.userInfoUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      return {
        id: response.data.sub || response.data.id,
        fullName: response.data.name || response.data.full_name,
        email: response.data.email,
        phoneNumber: response.data.phone_number,
        identityNumber: response.data.identity_number,
      };
    } catch (error) {
      this.logger.error('VNeID user info fetch failed', error?.message);
      throw new Error('Failed to fetch VNeID user info');
    }
  }

  /**
   * Tạo URL redirect đến VNeID Login page
   */
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'openid profile email',
      state,
    });
    return `https://sso.vneid.vn/oauth2/authorize?${params.toString()}`;
  }
}
