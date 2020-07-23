# CANcloud - Open Source Telematics Platform

CANcloud is an open source portal for managing CAN bus data recorded via the [CANedge2](https://www.csselectronics.com/screen/product/can-lin-logger-wifi-canedge2/language/en). 

The tool is a simple front-end that can be hosted on a web server and accessed via your browser. 

At [CSS Electronics](https://www.csselectronics.com/screen/overview), we always host the latest version of CANcloud - but you can build, customize & host it yourself as well.

---

### Key features 

```
1. Securely login to any S3 server by providing your endpoint, credentials and bucket name
2. List all objects within an S3 bucket in a folder structure hierarchy
3. Easily navigate between connected CANedge2 devices via the sidebar
4. Download, share & delete objects - or upload files (e.g. firmware.bin for firmware over-the-air)
5. Configure CANedge devices via an online editor - and submit for easy over-the-air updates
6. Encrypt configuration passwords using the built-in encryption tool
7. Add device meta data (incl. pictures and searchable name/group/subgroup)
8. Easily customize the portal with your own logo and CSS styling (see `src/browser/index.html`)
9. Build the offline configuration editor, usable without an internet connection

```
---

### Documentation

For more details on CANcloud and the CANedge2 see below:  
- [CANcloud intro](https://www.csselectronics.com/screen/page/cancloud-telematics-platform/language/en)  
- [CANcloud docs](https://canlogger.csselectronics.com/canedge-getting-started/transfer-data/server-tools/cancloud-intro)  
- [CANedge2 CAN logger](https://www.csselectronics.com/screen/product/can-lin-logger-wifi-canedge2/language/en)  

---
### Simple self-hosting
You can easily host CANcloud on your own web server by unzipping the latest release contents to your target folder. 

#### Style customization 
If you wish to customize your self-hosted version of CANcloud, you can do so without building the tool. To add your own logo, simply replace the logo files in the `images/` folder. Further, in the `customize-css` folder you'll find a `customize.css` file that lets you easily modify the most relevant styles to create custom branding for your self-hosted CANcloud solution.

---

### Installation

#### Deployment (development mode)

1. Clone the repository
2. Run `npm install` in the folder to install application dependencies
3. Run `npm start` to run application in development mode

#### Deployment (production) 

1. Run `npm run build`
2. Copy the contents of the `site` folder to your web server 

You can now access your own self-hosted version of CANcloud - incl. any customizations made. 

#### Deployment (offline editor) 

1. Run `npm run simple`
2. Copy the offline editor from the `simple` folder 

#### Example of login details 
If you have set up e.g. an AWS S3 server and bucket, your login details could look as below:

```
endpoint: https://s3.amazonaws.com
accessKey: LBIDJHBOIZQ3XBJ23UUQ
secretKey: Jxasdeue3324e3/wqe9wewdcxsa219421Hsj
bucket: aws-cancloud-bucket
```

Note the following:  
- When logging into a MinIO server the port should be included (e.g. `https://5.103.118.41:9000`)  
- You need to create your bucket before you can login (i.e. outside of CANcloud, e.g. in your AWS console)  
- For some S3 servers (e.g. AWS), you may need to change the CORS config - see the [getting started docs](https://canlogger.csselectronics.com/canedge-getting-started/transfer-data/s3-server/)  

---
### Versioning
The CANcloud versioning is inspired by the semantic versioning system.

Each version is assigned three two digit numbers: `MAJOR`, `MINOR`, `PATCH`:

- `MAJOR`: Incompatible changes (e.g. requires new browser settings)
- `MINOR`: New backwards-compatible functionality (e.g. new features)
- `PATCH`: Backwards-compatible bug fixes (e.g. minor patches)

Example: `version 03.05.01`

---
### Contribution & support 
Feature suggestions, pull requests or questions are welcome!

You can contact us at CSS Electronics below:  
- [www.csselectronics.com](https://www.csselectronics.com)  
- [Contact form](https://www.csselectronics.com/screen/page/can-bus-logger-contact)  
- contact[at]csselectronics.com  


---
### Dependencies
CANcloud uses a number of libraries - the most important are:  
- `minio`: CANcloud utilizes some of the core structure & S3 SDK calls from the MinIO browser  
- `react-jsonschema-form`: This library enables the configuration editor GUI  

