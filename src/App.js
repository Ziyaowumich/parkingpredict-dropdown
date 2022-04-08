import './App.css';
import React from 'react';

// global variables to change where necessary
const DROPDOWN_API_ENDPOINT = 'https://n4fiig95t5.execute-api.us-east-1.amazonaws.com/prod/'; // TODO
const ML_API_ENDPOINT = 'https://0kejp8e23g.execute-api.us-east-1.amazonaws.com/prod/'; // TODO


// atob is deprecated but this function converts base64string to text string
const decodeFileBase64 = (base64String) => {
  return "data:image/png;base64," + base64String
};
  // From Bytestream to Percent-encoding to Original string
  //return decodeURIComponent(
    //atob(base64String).split("").map(function (c) {
      //return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
    //}).join("")
  //);
//};


function App() {
  const [inputFileData, setInputFileData] = React.useState(''); // represented as bytes data (string)
  const [outputFileData, setOutputFileData] = React.useState(''); // represented as readable data (text string)
  const [inputImage, setInputImage] = React.useState(''); // represented as bytes data (string)
  const [timedata, settimedata] = React.useState('')
  const [buttonDisable, setButtonDisable] = React.useState(true);
  const [submitButtonText, setSubmitButtonText] = React.useState('Submit');
  const [fileButtonText, setFileButtonText] = React.useState('Upload File');
  const [demoDropdownFiles, setDemoDropdownFiles] = React.useState([]);
  const [selectedDropdownFile, setSelectedDropdownFile] = React.useState('');
  const [timeDisable, settimeDisable] = React.useState(false);
  const [demoDisable, setdemoDisable] = React.useState(false);

  // make GET request to get demo files on load -- takes a second to load
  React.useEffect(() => {
    fetch(DROPDOWN_API_ENDPOINT)
    .then(response => response.json())
    .then(data => {
      // GET request error
      if (data.statusCode === 400) {
        console.log('Sorry! There was an error, the demo files are currently unavailable.')
      }

      // GET request success
      else {
        const s3BucketFiles = JSON.parse(data.body);
        setDemoDropdownFiles(s3BucketFiles["s3Files"]);
      }
    });
  }, [])


  // convert file to bytes data
  const convertFileToBytes = (inputFile) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(inputFile); // reads file as bytes data

      fileReader.onload = () => {
        resolve(fileReader.result);
      };

      fileReader.onerror = (error) => {
        reject(error);
      };
    });
  }


  // handle file input
  const handleChange = async (event) => {
    //Clear output text.
    setOutputFileData("");

    console.log('newly uploaded file');
    const inputFile = event.target.files[0];
    console.log(inputFile);


    // update file button text
    setFileButtonText(inputFile.name);

    // convert file to bytes data
    const base64Data = await convertFileToBytes(inputFile);
    setInputImage(base64Data);
    const base64DataArray = base64Data.split('base64,'); // need to get rid of 'data:image/png;base64,' at the beginning of encoded string
    const encodedString = base64DataArray[1];
    setInputFileData(encodedString);

    // enable submit button
    setButtonDisable(false);
    setdemoDisable(true);

    // clear response results
    setOutputFileData('');

    // reset demo dropdown selection
    setSelectedDropdownFile('');
  }


  // handle file submission
  const handleSubmit = (event) => {
    event.preventDefault();

    // temporarily disable submit button
    setButtonDisable(true);
    setSubmitButtonText('Loading Result...');

    // make POST request
    fetch(ML_API_ENDPOINT, {
      method: 'POST',
      headers: { "Content-Type": "application/json", "Accept": "text/plain" },
      body: JSON.stringify({ "image": inputFileData })
    }).then(response => response.json())
    .then(data => {
      // POST request error
      if (data.statusCode === 400) {
        const outputErrorMessage = JSON.parse(data.errorMessage)['outputResultsData'];
        setOutputFileData(outputErrorMessage);
      }

      // POST request success
      else {
        const outputBytesData = JSON.parse(data.body)['outputResultsData'];
        setOutputFileData(decodeFileBase64(outputBytesData));
      }

      // re-enable submit button
      setButtonDisable(false);
      settimeDisable(false);
      setdemoDisable(false);

      setSubmitButtonText('Submit');
    })
  }


  // handle demo dropdown file selection
  const handleDropdown = (event) => {
    setSelectedDropdownFile(event.target.value);

    // temporarily disable submit button
    setButtonDisable(true);
    settimeDisable(true);
    setSubmitButtonText('Loading Demo File...');

    // only make POST request on file selection
    if (event.target.value) {
      fetch(DROPDOWN_API_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify({ "fileName": event.target.value })
      }).then(response => response.json())
      .then(data => {

        // POST request error
        if (data.statusCode === 400) {
          console.log('Uh oh! There was an error retrieving the dropdown file from the S3 bucket.')
        }

        // POST request success
        else {
          const dropdownFileBytesData = JSON.parse(data.body)['bytesData'];
          setInputFileData(dropdownFileBytesData);
          setInputImage('data:image/png;base64,' + dropdownFileBytesData); // hacky way of setting image from bytes data - even works on .jpeg lol
          setSubmitButtonText('Submit');
          setButtonDisable(false);
          
        }
      });
    }

    else {
      setInputFileData('');
    }
  }
  const handleunchange = async (event) =>{
    console.log(event.target.value);
    settimedata(event.target.value);
    setOutputFileData("");

    console.log('newly uploaded file');
    const inputFile = new File([event.target.value.substring(0,2)], "time.txt", {type:"text/plain"});
    console.log(inputFile);

    // convert file to bytes data
    const base64Data = await convertFileToBytes(inputFile);
    const base64DataArray = base64Data.split('base64,'); // need to get rid of 'data:image/png;base64,' at the beginning of encoded string
    const encodedString = base64DataArray[1];
    setInputFileData(encodedString);
    console.log('file converted successfully');
    setButtonDisable(false);
    settimeDisable(false);
    setdemoDisable(true);
  }


  return (
    <div className="App">
      <div className="Input">
      <h1>Parking Prediction System by Ziyao Wang</h1>
      <a href="https://www.ziyaowang19971002.com/">To my personal website</a>
      <p>ziyaow@umich.edu</p>
      <a href="https://www.ziyaowang19971002.com/home/project-page/project1_spec">Click here for detailed project technical report</a>
        <h1>Enter your parking time</h1>
        <label htmlFor="demo-dropdown">Demo: pick a provided time </label>
        <select name="Select Image" id="demo-dropdown" value={selectedDropdownFile} onChange={handleDropdown} disabled = {demoDisable}>
            <option value="">-- Select time --</option>
            {demoDropdownFiles.map((file) => <option key={file} value={file}>{file}</option>)}
        </select>
        <form onSubmit={handleSubmit}>
          <label for="appt">Choose your own parking time :  </label>
            <input type="time" id="appt" name="appt" min="00:00" max="23:59" onChange={handleunchange} disabled={timeDisable}/>  
          <button type="submit" disabled = {buttonDisable}>  {submitButtonText}</button>
        </form>
      </div>
      <div className="Output">
        <h1>Parking Prediction</h1>
        <img src={outputFileData} width="auto" height= "auto" alt="" />
        
      </div>
      
    </div>
  );
}

export default App;