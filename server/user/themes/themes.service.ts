import { Injectable } from '@nestjs/common';
import { ThemesDto } from './dto/themes.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Theme } from './schemas/theme.schema';
import { Model } from 'mongoose';

@Injectable()
export class ThemesService {
  constructor(
    @InjectModel(Theme.name)
    private readonly themeModel: Model<Theme>
  ) {}

  async getAllThemes(username: string): Promise<Array<ThemesDto> | void> {
    return await this.themeModel.find({ username }).exec().catch(console.log);
  }
  async insertTheme(theme: ThemesDto) {
    await this.themeModel.create(theme).catch(console.log);
  }

  async updateTheme(theme: ThemesDto): Promise<ThemesDto | void> {
    return await this.themeModel
      .findOneAndUpdate({ username: theme.username, key: theme.key }, theme)
      .catch(console.log);
  }

  async deleteTheme(key: string, username: string): Promise<ThemesDto | void> {
    return await this.themeModel
      .findOneAndDelete({ username: username, key: key })
      .catch(console.log);
  }
}