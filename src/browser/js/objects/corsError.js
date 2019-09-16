import React from "react";

const CorsError = props => {
  return (
    <div className="cors-config">
      <p className="text-center">
        <i className="fa fa-exclamation-triangle cors-error-ico" />
      </p>
      <p>
        We are unable to connect to the bucket {props.currentBucket} as the
        bucket's CORS configuration for this domain is not enabled. CORS needs
        to be configured on the S3 bucket to be accessed directly from the
        browser.
      </p>
      <p>
        If you're using AWS, please follow the below steps to enable CORS to
        access the bucket objects:
      </p>
      <ol>
        <li>Navigate to the Amazon S3 console.</li>
        <li>
          Choose an existing bucket or create a new bucket if desired. Note the
          bucket name and bucket region for later use in the application.
        </li>
        <li>
          Click the Properties tab, open the Permissions section, and click Edit
          CORS Configuration.
        </li>
        <li>Copy the below XML into the text box and click Save.</li>
      </ol>
      <pre className="cors-code">
        <p>&lt;?xml version="1.0" encoding="UTF-8"?&gt;</p>
        <p>
          &lt;CORSConfiguration
          xmlns="http://s3.amazonaws.com/doc/2006-03-01"&gt;
        </p>
        <p>&nbsp;&nbsp; &lt;CORSRule&gt;</p>
        <p>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          &lt;AllowedOrigin&gt;*&lt;/AllowedOrigin&gt;
        </p>
        <p>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          &lt;AllowedMethod&gt;GET&lt;/AllowedMethod&gt;
        </p>
        <p>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          &lt;AllowedMethod&gt;PUT&lt;/AllowedMethod&gt;
        </p>
        <p>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          &lt;AllowedMethod&gt;POST&lt;/AllowedMethod&gt;
        </p>
        <p>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          &lt;AllowedMethod&gt;DELETE&lt;/AllowedMethod&gt;
        </p>
        <p>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          &lt;AllowedHeader&gt;*&lt;/AllowedHeader&gt;
        </p>
        <p>&nbsp;&nbsp; &lt;/CORSRule&gt;</p>
        <p>&lt;/CORSConfiguration&gt;</p>
      </pre>
    </div>
  );
};

export default CorsError;
