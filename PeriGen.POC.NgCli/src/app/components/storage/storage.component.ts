import { Component, OnInit } from '@angular/core';
import { DataStorageService } from "../../services/data-storage.service";

export interface TestInterface {
  testprop1: number;
  testprop2: string;
  testprop3: boolean;
  testprop4: {
    testpropchild1: number;
    testpropchild2: string;
    testpropchild3: boolean;
  },
  testprop5: number[]
}

@Component({
  selector: 'pg-storage',
  templateUrl: './storage.component.html',
  styleUrls: ['./storage.component.scss']
})
export class StorageComponent implements OnInit {

  private storageString: string;
  private myJson: string = "";
  private count: number = 0;

  constructor(private _storageService: DataStorageService) { }

  ngOnInit() {
    this.updateStorageString();
  }

  storeObject(): void {
    var testObject: TestInterface = {
      testprop1: 1,
      testprop2: "test",
      testprop3: false,
      testprop4: {
        testpropchild1: 1,
        testpropchild2: "testchild",
        testpropchild3: false
      },
      testprop5: [1, 2, 3, 4, 5]
    }
    this._storageService.setItem<TestInterface>("testObject" + this.count, testObject);
    this.updateStorageString();

    var myReceivedObject = this._storageService.getItem<TestInterface>("testObject" + this.count);
    this.myJson = JSON.stringify(myReceivedObject, null, '\t');

    this.count++;
  }

  clearStorage(): void {
    this._storageService.clear();
  }

  private updateStorageString(): void {
    this.storageString = this._storageService.getStorageSpace();
  }

}
