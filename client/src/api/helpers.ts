import axiosInstance from "./axiosInstance";

export interface Theme {
  _id: string;
  name: string;
}

export interface AgeRange {
  _id: string;
  rangeLabel: string;
  minAge: number;
  maxAge: number;
}

export interface Difficulty {
  _id: string;
  label: string;
  level: number;
}

class HelperAPI {
  // Lấy danh sách themes
  static async getThemes(): Promise<Theme[]> {
    const response = await axiosInstance.get("/helpers/themes");
    return response.data.data;
  }

  // Lấy danh sách age ranges
  static async getAgeRanges(): Promise<AgeRange[]> {
    const response = await axiosInstance.get("/helpers/age-ranges");
    return response.data.data;
  }

  // Lấy danh sách difficulties
  static async getDifficulties(): Promise<Difficulty[]> {
    const response = await axiosInstance.get("/helpers/difficulties");
    return response.data.data;
  }
}

export default HelperAPI;
