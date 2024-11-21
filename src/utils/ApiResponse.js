// standardising our response
// whenever need to send any response send it thru this class only so that it will be in standard format


class ApiResponse {
    constructor(statusCode, data, message="Success") {
        this.statusCode = statusCode
        this.data = data
        this.message = message
        this.success = statusCode < 400
    }
}

export {ApiResponse}