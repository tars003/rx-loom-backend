const { Observable, interval, withLatestFrom, combineLatest, } = require("rxjs");

let observables = [];
let obsFunctions = [];


let observer = {
    next: (value) => {
        console.log("Inside OBSERVER !!");
        console.log(value);

        // clearInterval(int1);
        // clearInterval(int2);
        // clearInterval(int3);

    },
    error: (err) => {
        console.log('Inside err function !!');
        console.log(err);
    }
}

for (let i = 1; i < 4; i++) {
    observables[i] = Observable.create((obs) => {
        obsFunctions[i] = (data) => {
            console.log(`Inside Observable ${i} : ${data}`);
            obs.next(data);
        }
    });
}




let flag = 0;
const int1 = setInterval(() => {
    obsFunctions[1](`Data1: ${Math.floor(Math.random()*(999-100+1)+100)}`);
}, 3000);

const int2 = setInterval(() => {
    obsFunctions[2](`Data2: ${Math.floor(Math.random()*(999-100+1)+100)}`);

}, 8000);

const int3 = setInterval(() => {
    obsFunctions[3](`Data3: ${Math.floor(Math.random()*(999-100+1)+100)}`);

}, 5000);

// let result = observables[2].pipe(withLatestFrom(observables[1]));
// result = observables[3].pipe(withLatestFrom(result));
a = combineLatest([observables[2], observables[1], observables[3]])
b = interval(3000);
result = b.pipe(withLatestFrom(a));
let subscription = result.subscribe(observer);




