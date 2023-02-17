/*
Copyright (c) 2023 tekVizion PVS, Inc. 

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import {PhoneCountry} from 'cdk-amazon-chime-resources';
export function isValid (country:any):PhoneCountry {
    switch (country) {
      case PhoneCountry[PhoneCountry.AT]:
        return PhoneCountry.AT;
      case PhoneCountry[PhoneCountry.AU]:
        return PhoneCountry.AU;
      case PhoneCountry[PhoneCountry.CA]:
        return PhoneCountry.CA;
      case PhoneCountry[PhoneCountry.CH]:
        return PhoneCountry.CH;
      case PhoneCountry[PhoneCountry.DE]:
        return PhoneCountry.DE;
      case PhoneCountry[PhoneCountry.DK]:
        return PhoneCountry.DK;
      case PhoneCountry[PhoneCountry.IE]:
        return PhoneCountry.IE;
      case PhoneCountry[PhoneCountry.IT]:
        return PhoneCountry.IT;
      case PhoneCountry[PhoneCountry.KR]:
        return PhoneCountry.KR;
      case PhoneCountry[PhoneCountry.NG]:
        return PhoneCountry.NG;
      case PhoneCountry[PhoneCountry.NZ]:
        return PhoneCountry.NZ;
      case PhoneCountry[PhoneCountry.PR]:
        return PhoneCountry.PR;
    case PhoneCountry[PhoneCountry.US]:
        return PhoneCountry.US;
      default:
        console.error('Invalid country value in .env file');
        process.exit(1);
    }
  
    
}
    

    
   