import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

// Create a GCP resource (Storage Bucket)
// const bucket = new gcp.storage.Bucket("my-bucket-pulumi1", {
//     location: "US"
// });

const bucket = new gcp.storage.Bucket("my-bucket-pulumi1", {
    website: {
        mainPageSuffix: "index.html"
    },
    uniformBucketLevelAccess: true,
    location: "US"
});

// Allow the contents of your bucket to be viewed anonymously over the Internet
const bucketIAMBinding = new gcp.storage.BucketIAMBinding("my-bucket-IAMBinding", {
    bucket: bucket.name,
    role: "roles/storage.objectViewer",
    members: ["allUsers"]
});

// Export the DNS name of the bucket
export const bucketName = bucket.url;

// save index.html as gcs bucket object
// const bucketObject = new gcp.storage.BucketObject("index.html", {
//     bucket: bucket.name,
//     source: new pulumi.asset.FileAsset("index.html")
// });

const bucketObject = new gcp.storage.BucketObject("index.html", {
    bucket: bucket.name,
    contentType: "text/html",
    source: new pulumi.asset.FileAsset("index.html")
});

// export the resulting bucket’s endpoint URL
export const bucketEndpoint = pulumi.concat("http://storage.googleapis.com/", bucket.name, "/", bucketObject.name);

// ================================================= gcf =============================================

/**
 * Deploy a function using the default runtime.
 */
 const greeting = new gcp.cloudfunctions.HttpCallbackFunction("greeting", (req, res) => {
    res.send(`Greetings from ${req.body.name || "Google Cloud Functions"}!`);
});

const invoker = new gcp.cloudfunctions.FunctionIamMember("invoker", {
    project: greeting.function.project,
    region: greeting.function.region,
    cloudFunction: greeting.function.name,
    role: "roles/cloudfunctions.invoker",
    member: "allUsers",
});

export const url = greeting.httpsTriggerUrl;

/**
 * Deploy a function using an explicitly set runtime.
 */
const runtime = "nodejs14"; // https://cloud.google.com/functions/docs/concepts/exec#runtimes
const explicitRuntimeGreeting = new gcp.cloudfunctions.HttpCallbackFunction(`greeting-${runtime}`, {
    runtime: runtime,
    callback: (req, res) => {
        res.send(`Greetings from ${req.body.name || "Google Cloud Functions"}!`);
    },
});

export const nodejs14Url = explicitRuntimeGreeting.httpsTriggerUrl;