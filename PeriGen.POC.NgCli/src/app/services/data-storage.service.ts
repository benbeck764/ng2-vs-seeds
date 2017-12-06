import { Injectable } from '@angular/core';

@Injectable()
export class DataStorageService {

  constructor() { }

  public setItem<T>(key: string, item: T): void {
    window.localStorage.setItem(key, JSON.stringify(item));
  }

  public getItem<T>(key: string): T {
    return <T>JSON.parse(window.localStorage.getItem(key));
  }

  public removeItem(key: string): void {
    window.localStorage.removeItem(key);
  }

  public clear(): void {
    window.localStorage.clear();
  }

  public getStorageSpace(): string {
    var allStrings: string = '';
    Object.keys(window.localStorage).forEach((key: string) => {
      allStrings += key;
      if (window.localStorage.hasOwnProperty(key)) {
        allStrings += window.localStorage[key];
      }
    });

    return allStrings ? 3 + ((allStrings.length * 16) / (8 * 1024)) + ' KB' : 'Empty (0 KB)';
  }
}
