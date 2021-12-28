import { of, Observable, interval } from 'rxjs';
import { map } from 'rxjs/operators';

var observer = new Observable(
    function subscribe(subscriber) {
        try {
            subscriber.next('My Observable');
            subscriber.next({
                name: 'Ajay',
                age: 21
            });
            subscriber.complete();
        } catch (err) {
            subscriber.error(err);
        }

    }
)

observer.subscribe(x => console.log(x), (e) => console.log(e), () => console.log('This Observable is completed'));













// map(x => x * x)(of(1,2,3))
//     .subscribe((v) => console.log(`Output is ${v}`));