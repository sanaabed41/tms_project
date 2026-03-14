import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
  jwtFromRequest: (req) => {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    console.log('🎯 Token extracted:', token ? token.substring(0, 30) + '...' : 'NULL');
    return token;
  },
  ignoreExpiration: false,
  secretOrKey: 'TMS_SECRET_2026',
});

    console.log('✅ JwtStrategy initialized');
  }

  async validate(payload: any) {
    console.log('🔑 JWT payload received:', payload);

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      console.log('❌ User not found for id:', payload.sub);
      throw new UnauthorizedException('User not found');
    }

    console.log('👤 Authenticated user:', user.email);

    // ⚠️ IMPORTANT : retourner un objet simple
    return {
  id: user.id,
  email: user.email,
  role: user.role,
};
  }
}