# ZAP Scanning Report

ZAP by [Checkmarx](https://checkmarx.com/).


## Summary of Alerts

| Risk Level | Number of Alerts |
| --- | --- |
| High | 0 |
| Medium | 0 |
| Low | 3 |
| Informational | 4 |




## Insights

| Level | Reason | Site | Description | Statistic |
| --- | --- | --- | --- | --- |
| Medium | Exceeded High | http://localhost:3000 | Percentage of responses with status code 4xx | 99 % |
| Low | Warning |  | ZAP warnings logged - see the zap.log file for details | 45    |
| Info | Informational | http://localhost:3000 | Percentage of endpoints with content type application/json | 100 % |
| Info | Informational | http://localhost:3000 | Percentage of endpoints with method DELETE | 6 % |
| Info | Informational | http://localhost:3000 | Percentage of endpoints with method GET | 49 % |
| Info | Informational | http://localhost:3000 | Percentage of endpoints with method POST | 37 % |
| Info | Informational | http://localhost:3000 | Percentage of endpoints with method PUT | 6 % |
| Info | Informational | http://localhost:3000 | Count of total endpoints | 125    |







## Alerts

| Name | Risk Level | Number of Instances |
| --- | --- | --- |
| Cross-Origin-Resource-Policy Header Missing or Invalid | Low | 1 |
| Server Leaks Information via "X-Powered-By" HTTP Response Header Field(s) | Low | Systemic |
| X-Content-Type-Options Header Missing | Low | 1 |
| A Client Error response code was returned by the server | Informational | 127 |
| Authentication Request Identified | Informational | 2 |
| Non-Storable Content | Informational | Systemic |
| Storable and Cacheable Content | Informational | 1 |




## Alert Detail



### [ Cross-Origin-Resource-Policy Header Missing or Invalid ](https://www.zaproxy.org/docs/alerts/90004/)



##### Low (Medium)

### Description

Cross-Origin-Resource-Policy header is an opt-in header designed to counter side-channels attacks like Spectre. Resource should be specifically set as shareable amongst different origins.

* URL: http://localhost:3000/docs-json
  * Node Name: `http://localhost:3000/docs-json`
  * Method: `GET`
  * Parameter: `Cross-Origin-Resource-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``


Instances: 1

### Solution

Ensure that the application/web server sets the Cross-Origin-Resource-Policy header appropriately, and that it sets the Cross-Origin-Resource-Policy header to 'same-origin' for all web pages.
'same-site' is considered as less secured and should be avoided.
If resources must be shared, set the header to 'cross-origin'.
If possible, ensure that the end user uses a standards-compliant and modern web browser that supports the Cross-Origin-Resource-Policy header (https://caniuse.com/mdn-http_headers_cross-origin-resource-policy).

### Reference


* [ https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Embedder-Policy ](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Embedder-Policy)


#### CWE Id: [ 693 ](https://cwe.mitre.org/data/definitions/693.html)


#### WASC Id: 14

#### Source ID: 3

### [ Server Leaks Information via "X-Powered-By" HTTP Response Header Field(s) ](https://www.zaproxy.org/docs/alerts/10037/)



##### Low (Medium)

### Description

The web/application server is leaking information via one or more "X-Powered-By" HTTP response headers. Access to such information may facilitate attackers identifying other frameworks/components your web application is reliant upon and the vulnerabilities such components may be subject to.

* URL: http://localhost:3000/auth/me
  * Node Name: `http://localhost:3000/auth/me`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `X-Powered-By: Express`
  * Other Info: ``
* URL: http://localhost:3000/auth/customer
  * Node Name: `http://localhost:3000/auth/customer ()({document,trackingCode})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `X-Powered-By: Express`
  * Other Info: ``
* URL: http://localhost:3000/auth/login
  * Node Name: `http://localhost:3000/auth/login ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `X-Powered-By: Express`
  * Other Info: ``
* URL: http://localhost:3000/service-orders
  * Node Name: `http://localhost:3000/service-orders ()({"customer":{"document":"529.982.247-25","name":"ZAP","email":zaproxy@example.com,"phone":9999999999},"vehicle":{"plate":"BRA2E19","brand":"Volkswagen","model":"Gol","year":2020}})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `X-Powered-By: Express`
  * Other Info: ``
* URL: http://localhost:3000/users
  * Node Name: `http://localhost:3000/users ()({name,email,password,role})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `X-Powered-By: Express`
  * Other Info: ``

Instances: Systemic


### Solution

Ensure that your web server, application server, load balancer, etc. is configured to suppress "X-Powered-By" headers.

### Reference


* [ https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/01-Information_Gathering/08-Fingerprint_Web_Application_Framework ](https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/01-Information_Gathering/08-Fingerprint_Web_Application_Framework)
* [ https://www.troyhunt.com/shhh-dont-let-your-response-headers/ ](https://www.troyhunt.com/shhh-dont-let-your-response-headers/)


#### CWE Id: [ 497 ](https://cwe.mitre.org/data/definitions/497.html)


#### WASC Id: 13

#### Source ID: 3

### [ X-Content-Type-Options Header Missing ](https://www.zaproxy.org/docs/alerts/10021/)



##### Low (Medium)

### Description

The Anti-MIME-Sniffing header X-Content-Type-Options was not set to 'nosniff'. This allows older versions of Internet Explorer and Chrome to perform MIME-sniffing on the response body, potentially causing the response body to be interpreted and displayed as a content type other than the declared content type. Current (early 2014) and legacy versions of Firefox will use the declared content type (if one is set), rather than performing MIME-sniffing.

* URL: http://localhost:3000/docs-json
  * Node Name: `http://localhost:3000/docs-json`
  * Method: `GET`
  * Parameter: `x-content-type-options`
  * Attack: ``
  * Evidence: ``
  * Other Info: `This issue still applies to error type pages (401, 403, 500, etc.) as those pages are often still affected by injection issues, in which case there is still concern for browsers sniffing pages away from their actual content type.
At "High" threshold this scan rule will not alert on client or server error responses.`


Instances: 1

### Solution

Ensure that the application/web server sets the Content-Type header appropriately, and that it sets the X-Content-Type-Options header to 'nosniff' for all web pages.
If possible, ensure that the end user uses a standards-compliant and modern web browser that does not perform MIME-sniffing at all, or that can be directed by the web application/web server to not perform MIME-sniffing.

### Reference


* [ https://learn.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/compatibility/gg622941(v=vs.85) ](https://learn.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/compatibility/gg622941(v=vs.85))
* [ https://owasp.org/www-community/Security_Headers ](https://owasp.org/www-community/Security_Headers)


#### CWE Id: [ 693 ](https://cwe.mitre.org/data/definitions/693.html)


#### WASC Id: 15

#### Source ID: 3

### [ A Client Error response code was returned by the server ](https://www.zaproxy.org/docs/alerts/100000/)



##### Informational (High)

### Description

A response code of 401 was returned by the server.
This may indicate that the application is failing to handle unexpected input correctly.
Raised by the 'Alert on HTTP Response Code Error' script

* URL: http://localhost:3000/customers/id
  * Node Name: `http://localhost:3000/customers/id`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/customers/id/
  * Node Name: `http://localhost:3000/customers/id/`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/parts/id
  * Node Name: `http://localhost:3000/parts/id`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/parts/id/
  * Node Name: `http://localhost:3000/parts/id/`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/services/id
  * Node Name: `http://localhost:3000/services/id`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/services/id/
  * Node Name: `http://localhost:3000/services/id/`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/vehicles/id
  * Node Name: `http://localhost:3000/vehicles/id`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/vehicles/id/
  * Node Name: `http://localhost:3000/vehicles/id/`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000
  * Node Name: `http://localhost:3000`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://localhost:3000/
  * Node Name: `http://localhost:3000/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://localhost:3000/50159698021737286
  * Node Name: `http://localhost:3000/50159698021737286`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://localhost:3000/auth
  * Node Name: `http://localhost:3000/auth`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://localhost:3000/auth/
  * Node Name: `http://localhost:3000/auth/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://localhost:3000/auth/3656451487014302658
  * Node Name: `http://localhost:3000/auth/3656451487014302658`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://localhost:3000/auth/actuator/health
  * Node Name: `http://localhost:3000/auth/actuator/health`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://localhost:3000/auth/me
  * Node Name: `http://localhost:3000/auth/me`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/auth/me/
  * Node Name: `http://localhost:3000/auth/me/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/customer
  * Node Name: `http://localhost:3000/customer`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://localhost:3000/customer/
  * Node Name: `http://localhost:3000/customer/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://localhost:3000/customer/7851819337342161816
  * Node Name: `http://localhost:3000/customer/7851819337342161816`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://localhost:3000/customer/service-orders
  * Node Name: `http://localhost:3000/customer/service-orders`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/customer/service-orders%3Fpage=1&pageSize=20&status=RECEIVED&openedFrom=2026-10-01&openedTo=2026-10-31
  * Node Name: `http://localhost:3000/customer/service-orders (openedFrom,openedTo,page,pageSize,status)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/customer/service-orders/
  * Node Name: `http://localhost:3000/customer/service-orders/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/customer/service-orders/7753322034093578243
  * Node Name: `http://localhost:3000/customer/service-orders/7753322034093578243`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/customer/service-orders/id
  * Node Name: `http://localhost:3000/customer/service-orders/id`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/customer/service-orders/id/
  * Node Name: `http://localhost:3000/customer/service-orders/id/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/customer/service-orders/id/2790922891770976151
  * Node Name: `http://localhost:3000/customer/service-orders/id/2790922891770976151`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://localhost:3000/customers
  * Node Name: `http://localhost:3000/customers`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/customers%3Fpage=1&pageSize=20
  * Node Name: `http://localhost:3000/customers (page,pageSize)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/customers/
  * Node Name: `http://localhost:3000/customers/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/customers/5144738243188092837
  * Node Name: `http://localhost:3000/customers/5144738243188092837`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/customers/id
  * Node Name: `http://localhost:3000/customers/id`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/customers/id/
  * Node Name: `http://localhost:3000/customers/id/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/customers/search%3Fdocument=529.982.247-25
  * Node Name: `http://localhost:3000/customers/search (document)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/customers/search/
  * Node Name: `http://localhost:3000/customers/search/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/metrics
  * Node Name: `http://localhost:3000/metrics`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://localhost:3000/metrics/
  * Node Name: `http://localhost:3000/metrics/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://localhost:3000/metrics/1296491787049531319
  * Node Name: `http://localhost:3000/metrics/1296491787049531319`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://localhost:3000/metrics/average-execution-time
  * Node Name: `http://localhost:3000/metrics/average-execution-time`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/metrics/average-execution-time/
  * Node Name: `http://localhost:3000/metrics/average-execution-time/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/parts
  * Node Name: `http://localhost:3000/parts`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/parts%3Fpage=1&pageSize=20
  * Node Name: `http://localhost:3000/parts (page,pageSize)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/parts/
  * Node Name: `http://localhost:3000/parts/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/parts/2442299540022972442
  * Node Name: `http://localhost:3000/parts/2442299540022972442`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/parts/id
  * Node Name: `http://localhost:3000/parts/id`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/parts/id/
  * Node Name: `http://localhost:3000/parts/id/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/parts/id/3214560715945264483
  * Node Name: `http://localhost:3000/parts/id/3214560715945264483`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://localhost:3000/parts/unavailable%3Fpage=1&pageSize=20
  * Node Name: `http://localhost:3000/parts/unavailable (page,pageSize)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/parts/unavailable/
  * Node Name: `http://localhost:3000/parts/unavailable/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/service-orders
  * Node Name: `http://localhost:3000/service-orders`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/service-orders%3Fpage=1&pageSize=20&status=RECEIVED&customerId=customerId&openedFrom=2026-10-01&openedTo=2026-10-31
  * Node Name: `http://localhost:3000/service-orders (customerId,openedFrom,openedTo,page,pageSize,status)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/service-orders/
  * Node Name: `http://localhost:3000/service-orders/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/service-orders/1320584855577317781
  * Node Name: `http://localhost:3000/service-orders/1320584855577317781`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/service-orders/id
  * Node Name: `http://localhost:3000/service-orders/id`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/service-orders/id/
  * Node Name: `http://localhost:3000/service-orders/id/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/service-orders/id/3787035727279642889
  * Node Name: `http://localhost:3000/service-orders/id/3787035727279642889`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://localhost:3000/services
  * Node Name: `http://localhost:3000/services`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/services%3Fpage=1&pageSize=20
  * Node Name: `http://localhost:3000/services (page,pageSize)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/services/
  * Node Name: `http://localhost:3000/services/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/services/2756531100585327079
  * Node Name: `http://localhost:3000/services/2756531100585327079`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/services/id
  * Node Name: `http://localhost:3000/services/id`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/services/id/
  * Node Name: `http://localhost:3000/services/id/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/vehicles
  * Node Name: `http://localhost:3000/vehicles`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/vehicles%3Fpage=1&pageSize=20&customerId=customerId
  * Node Name: `http://localhost:3000/vehicles (customerId,page,pageSize)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/vehicles/
  * Node Name: `http://localhost:3000/vehicles/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/vehicles/364835084269981314
  * Node Name: `http://localhost:3000/vehicles/364835084269981314`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/vehicles/id
  * Node Name: `http://localhost:3000/vehicles/id`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/vehicles/id/
  * Node Name: `http://localhost:3000/vehicles/id/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/vehicles/search%3Fplate=BRA2E19
  * Node Name: `http://localhost:3000/vehicles/search (plate)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/vehicles/search/
  * Node Name: `http://localhost:3000/vehicles/search/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/auth/customer
  * Node Name: `http://localhost:3000/auth/customer ()({document,trackingCode})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://localhost:3000/auth/customer
  * Node Name: `http://localhost:3000/auth/customer ()({document,trackingCode})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/auth/customer/
  * Node Name: `http://localhost:3000/auth/customer/ ()({document,trackingCode})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/auth/login
  * Node Name: `http://localhost:3000/auth/login ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://localhost:3000/auth/login
  * Node Name: `http://localhost:3000/auth/login ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/auth/login/
  * Node Name: `http://localhost:3000/auth/login/ ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/computeMetadata/v1/
  * Node Name: `http://localhost:3000/computeMetadata/v1/ ()({document,trackingCode})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://localhost:3000/customer/service-orders/id/approve-quote
  * Node Name: `http://localhost:3000/customer/service-orders/id/approve-quote ()({version})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/customer/service-orders/id/approve-quote/
  * Node Name: `http://localhost:3000/customer/service-orders/id/approve-quote/ ()({version})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/customer/service-orders/id/reject-quote
  * Node Name: `http://localhost:3000/customer/service-orders/id/reject-quote ()({version,reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/customer/service-orders/id/reject-quote/
  * Node Name: `http://localhost:3000/customer/service-orders/id/reject-quote/ ()({version,reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/customers
  * Node Name: `http://localhost:3000/customers ()({"name":"ZAP","document":"529.982.247-25","email":zaproxy@example.com,"phone":9999999999})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://localhost:3000/customers/
  * Node Name: `http://localhost:3000/customers/ ()({"name":"ZAP","document":"529.982.247-25","email":zaproxy@example.com,"phone":9999999999})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://localhost:3000/latest/meta-data/
  * Node Name: `http://localhost:3000/latest/meta-data/ ()({document,trackingCode})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://localhost:3000/metadata/instance
  * Node Name: `http://localhost:3000/metadata/instance ()({document,trackingCode})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://localhost:3000/metadata/v1
  * Node Name: `http://localhost:3000/metadata/v1 ()({document,trackingCode})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://localhost:3000/opc/v1/instance/
  * Node Name: `http://localhost:3000/opc/v1/instance/ ()({document,trackingCode})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://localhost:3000/opc/v2/instance/
  * Node Name: `http://localhost:3000/opc/v2/instance/ ()({document,trackingCode})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://localhost:3000/openstack/latest/meta_data.json
  * Node Name: `http://localhost:3000/openstack/latest/meta_data.json ()({document,trackingCode})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://localhost:3000/parts
  * Node Name: `http://localhost:3000/parts ()({name,type,price,quantity})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/parts/
  * Node Name: `http://localhost:3000/parts/ ()({name,type,price,quantity})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/parts/id/stock-entry
  * Node Name: `http://localhost:3000/parts/id/stock-entry ()({quantity})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/parts/id/stock-entry/
  * Node Name: `http://localhost:3000/parts/id/stock-entry/ ()({quantity})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/service-orders
  * Node Name: `http://localhost:3000/service-orders ()({"customer":{"document":"529.982.247-25","name":"ZAP","email":zaproxy@example.com,"phone":9999999999},"vehicle":{"plate":"BRA2E19","brand":"Volkswagen","model":"Gol","year":2020}})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://localhost:3000/service-orders/
  * Node Name: `http://localhost:3000/service-orders/ ()({"customer":{"document":"529.982.247-25","name":"ZAP","email":zaproxy@example.com,"phone":9999999999},"vehicle":{"plate":"BRA2E19","brand":"Volkswagen","model":"Gol","year":2020}})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://localhost:3000/service-orders/id/additional-repair
  * Node Name: `http://localhost:3000/service-orders/id/additional-repair ()({services:[],parts:[{partId,quantity}]})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/service-orders/id/additional-repair/
  * Node Name: `http://localhost:3000/service-orders/id/additional-repair/ ()({services:[],parts:[{partId,quantity}]})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/service-orders/id/approve-quote
  * Node Name: `http://localhost:3000/service-orders/id/approve-quote ()({version})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/service-orders/id/approve-quote/
  * Node Name: `http://localhost:3000/service-orders/id/approve-quote/ ()({version})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/service-orders/id/conclude-diagnosis
  * Node Name: `http://localhost:3000/service-orders/id/conclude-diagnosis`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/service-orders/id/conclude-diagnosis/
  * Node Name: `http://localhost:3000/service-orders/id/conclude-diagnosis/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/service-orders/id/deliver
  * Node Name: `http://localhost:3000/service-orders/id/deliver`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/service-orders/id/deliver/
  * Node Name: `http://localhost:3000/service-orders/id/deliver/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/service-orders/id/finish
  * Node Name: `http://localhost:3000/service-orders/id/finish`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/service-orders/id/finish/
  * Node Name: `http://localhost:3000/service-orders/id/finish/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/service-orders/id/parts
  * Node Name: `http://localhost:3000/service-orders/id/parts ()({partId,quantity})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/service-orders/id/parts/
  * Node Name: `http://localhost:3000/service-orders/id/parts/ ()({partId,quantity})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/service-orders/id/reject-quote
  * Node Name: `http://localhost:3000/service-orders/id/reject-quote ()({version,reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/service-orders/id/reject-quote/
  * Node Name: `http://localhost:3000/service-orders/id/reject-quote/ ()({version,reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/service-orders/id/services
  * Node Name: `http://localhost:3000/service-orders/id/services ()({serviceId})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/service-orders/id/services/
  * Node Name: `http://localhost:3000/service-orders/id/services/ ()({serviceId})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/service-orders/id/start-diagnosis
  * Node Name: `http://localhost:3000/service-orders/id/start-diagnosis`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/service-orders/id/start-diagnosis/
  * Node Name: `http://localhost:3000/service-orders/id/start-diagnosis/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/services
  * Node Name: `http://localhost:3000/services ()({name,description,price,estimatedMinutes})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/services/
  * Node Name: `http://localhost:3000/services/ ()({name,description,price,estimatedMinutes})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/users
  * Node Name: `http://localhost:3000/users ()({name,email,password,role})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/users/
  * Node Name: `http://localhost:3000/users/ ()({name,email,password,role})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/vehicles
  * Node Name: `http://localhost:3000/vehicles ()({customerId,plate,brand,model,year})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/vehicles/
  * Node Name: `http://localhost:3000/vehicles/ ()({customerId,plate,brand,model,year})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/customers/id
  * Node Name: `http://localhost:3000/customers/id ()({"name":"ZAP","email":zaproxy@example.com,"phone":9999999999})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://localhost:3000/customers/id/
  * Node Name: `http://localhost:3000/customers/id/ ()({"name":"ZAP","email":zaproxy@example.com,"phone":9999999999})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://localhost:3000/parts/id
  * Node Name: `http://localhost:3000/parts/id ()({name,type,price})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/parts/id/
  * Node Name: `http://localhost:3000/parts/id/ ()({name,type,price})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/services/id
  * Node Name: `http://localhost:3000/services/id ()({name,description,price,estimatedMinutes})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/services/id/
  * Node Name: `http://localhost:3000/services/id/ ()({name,description,price,estimatedMinutes})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/vehicles/id
  * Node Name: `http://localhost:3000/vehicles/id ()({brand,model,year})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/vehicles/id/
  * Node Name: `http://localhost:3000/vehicles/id/ ()({brand,model,year})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``


Instances: 127

### Solution



### Reference



#### CWE Id: [ 388 ](https://cwe.mitre.org/data/definitions/388.html)


#### WASC Id: 20

#### Source ID: 4

### [ Authentication Request Identified ](https://www.zaproxy.org/docs/alerts/10111/)



##### Informational (High)

### Description

The given request has been identified as an authentication request. The 'Other Info' field contains a set of key=value lines which identify any relevant fields. If the request is in a context which has an Authentication Method set to "Auto-Detect" then this rule will change the authentication to match the request identified.

* URL: http://localhost:3000/users
  * Node Name: `http://localhost:3000/users ()({name,email,password,role})`
  * Method: `POST`
  * Parameter: `email`
  * Attack: ``
  * Evidence: `password`
  * Other Info: `userParam=email
userValue=zaproxy@example.com
passwordParam=password`
* URL: http://localhost:3000/auth/login
  * Node Name: `http://localhost:3000/auth/login ()({email,password})`
  * Method: `POST`
  * Parameter: `email`
  * Attack: ``
  * Evidence: `password`
  * Other Info: `userParam=email
userValue=zaproxy@example.com
passwordParam=password`


Instances: 2

### Solution

This is an informational alert rather than a vulnerability and so there is nothing to fix.

### Reference


* [ https://www.zaproxy.org/docs/desktop/addons/authentication-helper/auth-req-id/ ](https://www.zaproxy.org/docs/desktop/addons/authentication-helper/auth-req-id/)



#### Source ID: 3

### [ Non-Storable Content ](https://www.zaproxy.org/docs/alerts/10049/)



##### Informational (Medium)

### Description

The response contents are not storable by caching components such as proxy servers. If the response does not contain sensitive, personal or user-specific information, it may benefit from being stored and cached, to improve performance.

* URL: http://localhost:3000/auth/me
  * Node Name: `http://localhost:3000/auth/me`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/auth/customer
  * Node Name: `http://localhost:3000/auth/customer ()({document,trackingCode})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/auth/login
  * Node Name: `http://localhost:3000/auth/login ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://localhost:3000/service-orders
  * Node Name: `http://localhost:3000/service-orders ()({"customer":{"document":"529.982.247-25","name":"ZAP","email":zaproxy@example.com,"phone":9999999999},"vehicle":{"plate":"BRA2E19","brand":"Volkswagen","model":"Gol","year":2020}})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://localhost:3000/users
  * Node Name: `http://localhost:3000/users ()({name,email,password,role})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``

Instances: Systemic


### Solution

The content may be marked as storable by ensuring that the following conditions are satisfied:
The request method must be understood by the cache and defined as being cacheable ("GET", "HEAD", and "POST" are currently defined as cacheable)
The response status code must be understood by the cache (one of the 1XX, 2XX, 3XX, 4XX, or 5XX response classes are generally understood)
The "no-store" cache directive must not appear in the request or response header fields
For caching by "shared" caches such as "proxy" caches, the "private" response directive must not appear in the response
For caching by "shared" caches such as "proxy" caches, the "Authorization" header field must not appear in the request, unless the response explicitly allows it (using one of the "must-revalidate", "public", or "s-maxage" Cache-Control response directives)
In addition to the conditions above, at least one of the following conditions must also be satisfied by the response:
It must contain an "Expires" header field
It must contain a "max-age" response directive
For "shared" caches such as "proxy" caches, it must contain a "s-maxage" response directive
It must contain a "Cache Control Extension" that allows it to be cached
It must have a status code that is defined as cacheable by default (200, 203, 204, 206, 300, 301, 404, 405, 410, 414, 501).

### Reference


* [ https://datatracker.ietf.org/doc/html/rfc7234 ](https://datatracker.ietf.org/doc/html/rfc7234)
* [ https://datatracker.ietf.org/doc/html/rfc7231 ](https://datatracker.ietf.org/doc/html/rfc7231)
* [ https://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html ](https://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html)


#### CWE Id: [ 524 ](https://cwe.mitre.org/data/definitions/524.html)


#### WASC Id: 13

#### Source ID: 3

### [ Storable and Cacheable Content ](https://www.zaproxy.org/docs/alerts/10049/)



##### Informational (Medium)

### Description

The response contents are storable by caching components such as proxy servers, and may be retrieved directly from the cache, rather than from the origin server by the caching servers, in response to similar requests from other users. If the response data is sensitive, personal or user-specific, this may result in sensitive information being leaked. In some cases, this may even result in a user gaining complete control of the session of another user, depending on the configuration of the caching components in use in their environment. This is primarily an issue where "shared" caching servers such as "proxy" caches are configured on the local network. This configuration is typically found in corporate or educational environments, for instance.

* URL: http://localhost:3000/docs-json
  * Node Name: `http://localhost:3000/docs-json`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: ``
  * Other Info: `In the absence of an explicitly specified caching lifetime directive in the response, a liberal lifetime heuristic of 1 year was assumed. This is permitted by rfc7234.`


Instances: 1

### Solution

Validate that the response does not contain sensitive, personal or user-specific information. If it does, consider the use of the following HTTP response headers, to limit, or prevent the content being stored and retrieved from the cache by another user:
Cache-Control: no-cache, no-store, must-revalidate, private
Pragma: no-cache
Expires: 0
This configuration directs both HTTP 1.0 and HTTP 1.1 compliant caching servers to not store the response, and to not retrieve the response (without validation) from the cache, in response to a similar request.

### Reference


* [ https://datatracker.ietf.org/doc/html/rfc7234 ](https://datatracker.ietf.org/doc/html/rfc7234)
* [ https://datatracker.ietf.org/doc/html/rfc7231 ](https://datatracker.ietf.org/doc/html/rfc7231)
* [ https://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html ](https://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html)


#### CWE Id: [ 524 ](https://cwe.mitre.org/data/definitions/524.html)


#### WASC Id: 13

#### Source ID: 3


