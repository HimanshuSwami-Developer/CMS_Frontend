import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../../../redux/userRelated/userHandle';
import Popup from '../../../components/Popup';
import app from "../../../firebase";
import { underControl } from '../../../redux/userRelated/userSlice';
import { getAllSclasses } from '../../../redux/sclassRelated/sclassHandle';
import { CircularProgress } from '@mui/material';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const AddStudent = ({ situation }) => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const params = useParams()

    const userState = useSelector(state => state.user);
    const { status, currentUser, response, error } = userState;
    const { sclassesList } = useSelector((state) => state.sclass);

    const [name, setName] = useState('');
    const [rollNum, setRollNum] = useState('');
    const [password, setPassword] = useState('')
    const [className, setClassName] = useState('')
    const [sclassName, setSclassName] = useState('')

    //change
    const [img, setImg] = useState('');
    const [perc, setperc] = useState(0)
    const [input, setInput] = useState('')


    const photoUpload = (file, fileType) => {
        const folder = fileType === "photoUrl" ? "images/" : "file/";
        const d=new Date();
        const fileName = d.getTime() + file.name;
        const storage = getStorage(app);
        const storageRef = ref(storage, folder + fileName);

        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                fileType === "photoUrl" ? setperc(Math.round(progress)) : setperc(0);
                console.log('Upload is ' + progress + '% done');
                switch (snapshot.state) {
                    case 'paused':
                        console.log('Upload is paused');
                        break;
                    case 'running':
                        console.log('Upload is running');
                        break;
                    default:
                        break;
                }
            },
            (error) => {
                console.log(error);
                switch (error.code) {
                    case "storage/unauthorized":
                        console.log(error);
                        break;

                    default:
                        break;
                }
            },
            () => {
                // Handle successful uploads on complete
                // For instance, get the download URL: https://firebasestorage.googleapis.com/...
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    console.log('File available at', downloadURL);
                    setInput((perv) => {
                        return {
                            ...perv,
                            [fileType]: downloadURL
                        };
                    });
                });
                // setInput(()=> {return {[fileType]:downloadURL}});

            }
        );
    }



    const adminID = currentUser._id
    const role = "Student"
    const attendance = []

    useEffect(() => {
        if (situation === "Class") {
            setSclassName(params.id);
        }
    }, [params.id, situation]);

    const [showPopup, setShowPopup] = useState(false);
    const [message, setMessage] = useState("");
    const [loader, setLoader] = useState(false)

    useEffect(() => {
        dispatch(getAllSclasses(adminID, "Sclass"));
    }, [adminID, dispatch]);

    const changeHandler = (event) => {
        if (event.target.value === 'Select Class') {
            setClassName('Select Class');
            setSclassName('');
        } else {
            const selectedClass = sclassesList.find(
                (classItem) => classItem.sclassName === event.target.value
            );
            setClassName(selectedClass.sclassName);
            setSclassName(selectedClass._id);
        }
    }

    //change
    const fields = {
        name, rollNum, password,
        ...input,
        sclassName, adminID, role, attendance
    }


    useEffect(() => {
        // console.log(input);
            img && photoUpload(img, "photoUrl");
         console.log(img)
    }, [img]);

    // const changeImageHandler=(e)=>{
    //     const file=e.target.files[0];
    //     const reader=new FileReader();
    //     reader.readAsDataURL(file);
    //     reader.onload=()=>{
    //         setPhoto(reader.result);
    //     }
    // }

    const submitHandler = (event) => {
     event.preventDefault();
        if (sclassName === "") {
            setMessage("Please select a classname")
            setShowPopup(true)
        }
        else {
            console.log(fields);
            setLoader(true)
            dispatch(registerUser(fields, role))
        }
    }

    useEffect(() => {
        if (status === 'added') {
            dispatch(underControl())
            navigate(-1)
        }
        else if (status === 'failed') {
            setMessage(response)
            setShowPopup(true)
            setLoader(false)
        }
        else if (status === 'error') {
            setMessage("Network Error")
            setShowPopup(true)
            setLoader(false)
        }
    }, [
        status, navigate, error, response, dispatch
    ]);

    return (
        <>
            <div className="register">
                <form className="registerForm" onSubmit={submitHandler}>

                    <span className="registerTitle">Add Student</span>

                    <label>Name</label>
                    <input className="registerInput" type="text" placeholder="Enter student's name..."
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        autoComplete="name" required />

                    <label>Photo</label>{perc > 0 && "uploading " + perc + " %"}
                    <input type="file"
                        name="photoUrl"
                        accept="image/*"
                        // value={img}
                        // onChange={changeImageHandler}
                        onChange={(event) => setImg((prev) => event.target.files[0])}
                        className='registerInput' />
                    {img && (
                        <div className="text-center">
                            <img
                                src={URL.createObjectURL(img)}
                                alt="product_photo"
                                height={"200px"}
                                className="img img-responsive"
                            />
                        </div>
                    )}

                    {
                        situation === "Student" &&
                        <>
                            <label>Class</label>
                            <select
                                className="registerInput"
                                value={className}
                                onChange={changeHandler} required>
                                <option value='Select Class'>Select Class</option>
                                {sclassesList.map((classItem, index) => (
                                    <option key={index} value={classItem.sclassName}>
                                        {classItem.sclassName}
                                    </option>
                                ))}
                            </select>
                        </>
                    }

                    <label>Roll Number</label>
                    <input className="registerInput" type="number" placeholder="Enter student's Roll Number..."
                        value={rollNum}
                        onChange={(event) => setRollNum(event.target.value)}
                        required />

                    <label>Password</label>
                    <input className="registerInput" type="password" placeholder="Enter student's password..."
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete="new-password" required />

                    <button className="registerButton" type="submit" disabled={loader}>
                        {loader ? (
                            <CircularProgress size={24} color="inherit" />
                        ) : (
                            'Add'
                        )}
                    </button>
                </form>
            </div>
            <Popup message={message} setShowPopup={setShowPopup} showPopup={showPopup} />
        </>
    )
}

export default AddStudent