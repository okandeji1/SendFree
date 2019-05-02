export default class Gate {

    constructor(user) {
        this.user = user;
    }


    isAdmin() {
        return this.user.role === 'admin';
    }

    isSender() {
        return this.user.role === 'sender';
    }
    isReceiver() {
        if (this.user.receiver === 'receiver') {
            return true;
        }
    }

}