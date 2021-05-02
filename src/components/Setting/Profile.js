import {
  Avatar,
  Box,
  Button,
  Collapse,
  Grid,
  IconButton,
  makeStyles,
  Snackbar,
} from "@material-ui/core";
import {
  Add,
  Facebook,
  GitHub,
  Reddit,
  Remove,
  Telegram,
  Twitter,
} from "@material-ui/icons";
import PersonOutlineIcon from "@material-ui/icons/PersonOutline";
import Alert from "@material-ui/lab/Alert";
import { FieldArray, Formik } from "formik";
import React, { createRef, Fragment, useEffect, useState } from "react";
import Loader from "react-loader-spinner";
import { useDispatch, useSelector } from "react-redux";
import * as Yup from "yup";
import { setLoaderDisplay } from "../../redux/action-reducers-epic/SnLoaderAction";
import { setUserProfileAction } from "../../redux/action-reducers-epic/SnUserProfileAction";
import { getInitValAndValidationSchemaFromSnFormikObj } from "../../service/SnFormikUtilService";
import { setProfile } from "../../service/SnSkappService";
import SnUpload from "../../uploadUtil/SnUpload";
import { UPLOAD_SOURCE_NEW_HOSTING_IMG } from "../../utils/SnConstants";
import { skylinkToUrl } from "../../utils/SnUtility";
import {
  SnInputWithIcon,
  SnTextArea,
  SnTextInput,
  SnTextInputTag,
} from "../Utils/SnFormikControlls";

const useStyles = makeStyles((theme) => ({
  ProfileRoot: {
    backgroundColor: "#fff",
    boxShadow: "0px 2px 5px #15223214",
    borderRadius: 6,
    padding: "50px 30px",
    "@media only screen and (max-width: 575px)": {
      padding: "20px 10px",
    },
    "& h2": {
      color: "#242F57",
      marginBottom: "1rem",
      "@media only screen and (max-width: 575px)": {
        fontSize: 22,
      },
    },
  },
  textInfo: {
    color: "#000",
    fontSize: 14,
    "@media only screen and (max-width: 575px)": {
      fontSize: 13,
    },
  },
  submitBtn: {
    float: "right",
    "& svg": {
      fontSize: "19px",
      marginRight: "5px",
    },
    "@media only screen and (max-width: 575px)": {
      fontSize: "12px",
    },
  },
  siteLogo: {
    background: "#fff",
    cursor: "pointer",
    height: 150,
    width: 150,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    border: "1px solid #D9E1EC",
    borderRadius: "50%",
    marginBottom: 10,
    marginTop: 10,
    "@media only screen and (max-width: 575px)": {
      width: 75,
      height: 75,
      // maxWidth: 340,
      marginLeft: "auto",
      marginRight: "auto",
    },
  },
  label: {
    display: "block",
    color: "#5A607F",
    marginBottom: 8,
    fontSize: 18,
    "@media only screen and (max-width: 575px)": {
      fontSize: 16,
    },
  },
  profilePlaceholder: {
    width: 150,
    height: 150,
    background: "#EFF5F7",
    display: "flex",
    borderRadius: "50%",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    "& svg": {
      fontSize: 89,
      // marginTop: '2.9rem',
      color: "#B4C6CC",
    },
    "@media only screen and (max-width: 575px)": {
      width: 75,
      height: 75,
      "& svg": {
        fontSize: 45,
        // marginTop: '2.9rem',
        color: "#B4C6CC",
      },
    },
  },
  btnUpload: {
    backgroundColor: "#869EA6!important",
    color: "#fff",
    fontSize: 14,
    minWidth: 150,
    "@media only screen and (max-width: 575px)": {
      fontSize: 12,
      height: 40,
    },
    "& svg": {
      marginRight: 7,
    },
  },
  textHelper: {
    fontSize: 13,
    color: "#5C757D",
    marginTop: 5,
    "@media only screen and (max-width: 575px)": {
      fontSize: 12,
    },
  },
  form: {
    marginTop: 20,
  },
  inputGuide: {
    color: "#5C757D",
    "@media only screen and (max-width: 575px)": {
      fontSize: 12,
    },
  },
  input: {
    background: "#fff",
    border: "1px solid #D9E1EC",
    borderRadius: 8,
    height: 55,
    width: "100%",
    fontSize: 18,
    padding: 20,
    "@media only screen and (max-width: 1440px)": {
      height: 50,
      // width: '100%',
      fontSize: 16,
      padding: 15,
    },
    "@media only screen and (max-width: 575px)": {
      height: 43,
      // width: '100%',
      fontSize: "14px !important",
      padding: 10,
    },
  },
  inputContainer: {
    "& > label": {
      display: "block",
      color: "#5A607F",
      marginBottom: 7,
    },
    "& input:focus, & select:focus": {
      outline: "none!important",
      border: "1px solid #1DBF73",
    },
    marginTop: "25px",
    "&": {
      marginRight: "1rem",
    },
    "& input, & input": {
      fontSize: 18,
    },
    "@media only screen and (max-width: 575px)": {
      marginTop: "16px",
      marginRight: "10px",
    },
  },
  firstInput: {
    marginTop: 5,
    "@media only screen and (max-width: 575px)": {
      marginBottom: 10,
    },
  },
  small_avatar: {
    margin: 8,
    height: 64,
    width: 64,
    cursor: "pointer",
  },
}));

const initailValueFormikObj = {
  username: ["", Yup.string().required("This field is required")],
  emailID: [
    "",
    Yup.string().email("Invalid email").required("This field is required"),
  ],
  firstName: [""],
  lastName: [""],
  contact: ["", Yup.string().required("This field is required")],
  aboutMe: [""],
  location: [""],
  topicsHidden: [[]],
  topicsDiscoverable: [[]],
  avatar: [{}],
  facebook: [""],
  twitter: [""],
  github: [""],
  reddit: [""],
  telegram: [""],
  otherConnections: [[]],
};

const socialConnectionList = [
  { name: "Github", icon: <GitHub /> },
  { name: "Twitter", icon: <Twitter /> },
  { name: "Facebook", icon: <Facebook /> },
  { name: "Reddit", icon: <Reddit /> },
  { name: "Telegram", icon: <Telegram /> },
];

const Profile = () => {
  const [isInitialDataAvailable, setIsInitialDataAvailable] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); // to show Model
  const [isError, setIsError] = useState(false); // to show Model
  const [formikObj, setFormikObj] = useState(initailValueFormikObj); // to store Formik Form data
  const [isLogoUploaded, setIsLogoUploaded] = useState(false);
  const [showAvatarList, setShowAvatarList] = useState(false);

  const classes = useStyles();
  const dispatch = useDispatch();

  const imgUploadEleRef = createRef();

  const userProfile = useSelector((state) => state.snUserProfile);

  useEffect(() => {
    setProfileFormicObj(userProfile);
    setIsInitialDataAvailable(true);
  }, [userProfile]);

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setIsSuccess(false);
  };

  const handleDropZoneClick = (evt, dropZoneRef) => {
    evt.preventDefault();
    evt.stopPropagation();
    dropZoneRef.current.gridRef.current.click();
  };

  const handleImgUpload = (obj, formik) => {
    formik.setFieldValue("avatar", { url: `sia:${obj.thumbnail}` }, true);
    setIsLogoUploaded(false);
  };

  const setProfileFormicObj = (profile) => {
    //console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ profile from DAC ="+ JSON.stringify(profile))
    if (profile && profile?.username) {
      formikObj.username[0] = `${profile?.username}`;
      formikObj.emailID[0] = `${profile?.emailID}`;
      formikObj.firstName[0] = `${profile?.firstName}`;
      formikObj.lastName[0] = `${profile?.lastName}`;
      formikObj.contact[0] = `${profile?.contact}`;
      formikObj.location[0] = `${profile?.location}`;
      formikObj.aboutMe[0] = `${profile?.aboutMe}`;
      formikObj.otherConnections[0] = profile?.otherConnections || [];
      formikObj.facebook[0] = `${
        profile?.connections?.find(({ facebook }) => facebook)?.facebook ?? ""
      }`;
      formikObj.twitter[0] = `${
        profile?.connections?.find(({ twitter }) => twitter)?.twitter ?? ""
      }`;
      formikObj.github[0] = `${
        profile?.connections?.find(({ github }) => github)?.github ?? ""
      }`;
      formikObj.reddit[0] = `${
        profile?.connections?.find(({ reddit }) => reddit)?.reddit ?? ""
      }`;
      formikObj.telegram[0] = `${
        profile?.connections?.find(({ telegram }) => telegram)?.telegram ?? ""
      }`;
      formikObj.topicsHidden[0] = profile?.topicsHidden ?? [[]];
      formikObj.topicsDiscoverable[0] = profile?.topicsDiscoverable ?? [[]];
      if (profile?.avatar && profile?.avatar[0]?.url) {
        formikObj.avatar = profile.avatar;
      }
      setFormikObj(formikObj);
    } else {
      setFormikObj(initailValueFormikObj);
    }
  };

  const submitProfileForm = async ({
    twitter,
    facebook,
    reddit,
    github,
    telegram,
    avatar,
    ...rest
  }) => {
    dispatch(setLoaderDisplay(true));
    let profileJSON = {
      ...rest,
      connections: [
        { twitter },
        { facebook },
        { github },
        { reddit },
        { telegram },
      ],
      avatar: [avatar],
    };
    await setProfile(profileJSON);
    dispatch(setUserProfileAction(profileJSON));
    setIsSuccess(true);
    dispatch(setLoaderDisplay(false));
  };

  const handleAddChannelRow = (arrayHelpers) => () => {
    arrayHelpers.push({
      channel: "",
      url: "",
    });
  };

  const handleRemoveChannelRow = (arrayHelpers, ind) => () => {
    arrayHelpers.remove(ind);
  };

  const toggleAvatarListVisibility = () => {
    setShowAvatarList((show) => !show);
    console.log(avatarList.length);
  };

  const handleAvatarClick = (setFieldValue, imgUrl) => () => {
    setFieldValue("avatar", {
      url: imgUrl,
    });
  };

  return (
    <div className={classes.ProfileRoot}>
      <Box>
        <Snackbar
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          open={isSuccess}
          autoHideDuration={5000}
        >
          <Alert onClose={handleClose} severity="success">
            User Profile Successfully Saved!
          </Alert>
        </Snackbar>
        <Snackbar
          aranchorOrigin={{ vertical: "top", horizontal: "center" }}
          open={isError}
          autoHideDuration={5000}
        >
          <Alert onClose={handleClose} severity="error">
            Error Occurred while saving profile!
          </Alert>
        </Snackbar>
        {isInitialDataAvailable ? (
          <Formik
            initialValues={
              getInitValAndValidationSchemaFromSnFormikObj(formikObj)
                .initialValues
            }
            validationSchema={Yup.object(
              getInitValAndValidationSchemaFromSnFormikObj(formikObj)
                .validationSchema
            )}
            validateOnChange={true}
            validateOnBlur={true}
            enableReinitialize={true}
            onSubmit={submitProfileForm}
          >
            {({ values, ...formik }) => (
              <form onSubmit={formik.handleSubmit}>
                <h2>
                  Global User Profile{" "}
                  <Button
                    variant="contained"
                    color="primary"
                    disableElevation
                    className={classes.submitBtn}
                    onClick={formik.handleSubmit}
                  >
                    <Add /> Save Changes{" "}
                  </Button>
                </h2>

                <Box component="form">
                  <Box>
                    <div className="d-none">
                      <SnUpload
                        name="files"
                        source={UPLOAD_SOURCE_NEW_HOSTING_IMG}
                        ref={imgUploadEleRef}
                        directoryMode={false}
                        onUpload={(obj) => handleImgUpload(obj, formik)}
                        uploadStarted={(e) => setIsLogoUploaded(e)}
                      />
                    </div>
                    <div
                      className={classes.siteLogo}
                      onClick={(evt) =>
                        handleDropZoneClick(evt, imgUploadEleRef)
                      }
                    >
                      {!isLogoUploaded &&
                        Object.keys(values.avatar).length == 0 && (
                          <div className={classes.profilePlaceholder}>
                            <PersonOutlineIcon className={classes.avatarIcon} />
                          </div>
                        )}
                      {!isLogoUploaded &&
                        Object.keys(values.avatar).length > 0 && (
                          <img
                            alt="app"
                            src={skylinkToUrl(values.avatar.url)}
                            className={classes.siteLogo}
                            onClick={(evt) =>
                              handleDropZoneClick(evt, imgUploadEleRef)
                            }
                            name="1"
                          />
                        )}
                      {isLogoUploaded ? (
                        <Loader
                          type="Oval"
                          color="#57C074"
                          height={50}
                          width={50}
                        />
                      ) : null}
                    </div>
                    <div className={classes.inputGuide}>JPG or PNG.</div>
                    <input type="text" hidden />
                  </Box>

                  <Button
                    variant="contained"
                    color="primary"
                    disableElevation
                    onClick={toggleAvatarListVisibility}
                  >
                    Choose Random Avatar
                  </Button>

                  <Collapse in={showAvatarList}>
                    <Box display="flex" flexWrap="wrap" my="1rem">
                      {avatarList.map((item, ind) => (
                        <Avatar
                          className={classes.small_avatar}
                          src={item}
                          key={item}
                          onClick={handleAvatarClick(
                            formik.setFieldValue,
                            item
                          )}
                        />
                      ))}
                    </Box>
                  </Collapse>

                  <Box
                    display="flex"
                    className={`${classes.formRow} formSiteRow`}
                  >
                    <Box className={`${classes.inputContainer}`} flex={1}>
                      <SnTextInput
                        label={
                          <span>
                            {" "}
                            Username <span style={{ color: "red" }}>*</span>
                          </span>
                        }
                        name="username"
                        className={classes.input}
                        type="text"
                      />
                    </Box>
                    <Box className={`${classes.inputContainer}`} flex={1}>
                      <SnTextInput
                        label="First Name"
                        name="firstName"
                        className={classes.input}
                        type="text"
                      />
                    </Box>
                    <Box className={`${classes.inputContainer}`} flex={1}>
                      <SnTextInput
                        label="Last Name"
                        name="lastName"
                        className={classes.input}
                        type="text"
                      />
                    </Box>
                  </Box>
                  <Box
                    display="flex"
                    className={`${classes.formRow} formSiteRow`}
                  >
                    <Box className={`${classes.inputContainer}`} flex={1}>
                      <SnTextInput
                        label="Location"
                        name="location"
                        className={classes.input}
                        type="text"
                      />
                    </Box>
                    <Box className={`${classes.inputContainer}`} flex={1}>
                      <SnTextInput
                        label="Email"
                        name="emailID"
                        className={classes.input}
                        type="text"
                      />
                    </Box>
                    <Box className={`${classes.inputContainer}`} flex={1}>
                      <SnTextInput
                        label="Contact"
                        name="contact"
                        className={classes.input}
                        type="text"
                      />
                    </Box>
                  </Box>
                  <Box
                    display="flex"
                    className={`${classes.formRow} formSiteRow`}
                  >
                    <Box className={`${classes.inputContainer}`} flex={1}>
                      <SnTextArea
                        label="About me"
                        name="aboutMe"
                        className={classes.input}
                      />
                    </Box>
                  </Box>
                  <Box
                    display="flex"
                    className={`${classes.formRow} formSiteRow`}
                  >
                    <Box className={`${classes.inputContainer}`} flex={1}>
                      <SnTextInputTag
                        label="Topics Hidden"
                        name="topicsHidden"
                        className={classes.input}
                      />
                    </Box>
                    <Box className={`${classes.inputContainer}`} flex={1}>
                      <SnTextInputTag
                        label="Topics Discoverable"
                        name="topicsDiscoverable"
                        className={classes.input}
                      />
                    </Box>
                  </Box>

                  <Box
                    display="flex"
                    className={`${classes.formRow} formSiteRow`}
                  >
                    <Box className={`${classes.inputContainer}`} flex={1}>
                      <label>Social Connections</label>
                    </Box>
                  </Box>

                  <Grid container spacing={0}>
                    {socialConnectionList.map((item) => (
                      <Grid item sm={6} xs={12} key={item.name}>
                        <Box className={`${classes.inputContainer}`}>
                          <SnInputWithIcon
                            icon={item.icon}
                            label={item.name}
                            name={item.name.toLocaleLowerCase()}
                            type="text"
                          />
                        </Box>
                      </Grid>
                    ))}
                  </Grid>

                  <FieldArray name="otherConnections">
                    {(arrayHelpers) => (
                      <Fragment>
                        <Grid container spacing={0} alignItems="flex-end">
                          {values.otherConnections?.map((item, ind) => (
                            <Fragment key={ind}>
                              <Grid item sm={5} xs={12}>
                                <Box className={`${classes.inputContainer}`}>
                                  <SnTextInput
                                    className={classes.input}
                                    label="Channel"
                                    name={`otherConnections[${ind}].channel`}
                                    type="text"
                                  />
                                </Box>
                              </Grid>
                              <Grid item sm={6} xs={12}>
                                <Box className={`${classes.inputContainer}`}>
                                  <SnTextInput
                                    className={classes.input}
                                    label="Channel Url"
                                    name={`otherConnections[${ind}].url`}
                                    type="text"
                                  />
                                </Box>
                              </Grid>
                              <Grid item sm={1} xs={12}>
                                <IconButton
                                  onClick={handleRemoveChannelRow(
                                    arrayHelpers,
                                    ind
                                  )}
                                >
                                  <Remove />
                                </IconButton>
                              </Grid>
                            </Fragment>
                          ))}
                        </Grid>

                        <Box textAlign="center" mt="1.5rem">
                          <IconButton
                            onClick={handleAddChannelRow(arrayHelpers)}
                          >
                            <Add />
                          </IconButton>
                        </Box>
                      </Fragment>
                    )}
                  </FieldArray>
                </Box>
              </form>
            )}
          </Formik>
        ) : null}
      </Box>
    </div>
  );
};

const avatarList = [
  "https://avataaars.io/?avatarStyle=Transparent&clotheColor=PastelRed&clotheType=BlazerShirt&eyeType=WinkWacky&eyebrowType=UpDownNatural&facialHairColor=Platinum&facialHairType=BeardMedium&graphicType=Resist&hairColor=Platinum&hatColor=Blue01&mouthType=Eating&skinColor=Tanned&topType=LongHairDreads",
  "https://avataaars.io/?avatarStyle=Transparent&clotheColor=Black&clotheType=ShirtVNeck&eyeType=Cry&eyebrowType=DefaultNatural&facialHairColor=BrownDark&facialHairType=MoustacheFancy&graphicType=SkullOutline&hairColor=Auburn&hatColor=Heather&mouthType=Tongue&skinColor=Black&topType=LongHairBigHair",
  "https://avataaars.io/?avatarStyle=Transparent&clotheColor=White&clotheType=ShirtScoopNeck&eyeType=Hearts&eyebrowType=UpDownNatural&facialHairColor=Platinum&facialHairType=BeardLight&graphicType=Selena&hairColor=Red&hatColor=PastelRed&mouthType=Tongue&skinColor=Tanned&topType=ShortHairDreads02",
  "https://avataaars.io/?avatarStyle=Transparent&clotheColor=Heather&clotheType=ShirtVNeck&eyeType=Cry&eyebrowType=UnibrowNatural&facialHairColor=BrownDark&facialHairType=MoustacheFancy&graphicType=Deer&hairColor=SilverGray&hatColor=PastelYellow&mouthType=Twinkle&skinColor=Brown&topType=LongHairFrida",
  "https://avataaars.io/?avatarStyle=Transparent&clotheColor=Heather&clotheType=ShirtCrewNeck&eyeType=Default&eyebrowType=UpDownNatural&facialHairColor=Red&facialHairType=BeardMedium&graphicType=Resist&hairColor=PastelPink&hatColor=Black&mouthType=Tongue&skinColor=Brown&topType=ShortHairShortWaved",
  "https://avataaars.io/?avatarStyle=Transparent&clotheColor=Heather&clotheType=BlazerShirt&eyeType=Squint&eyebrowType=FlatNatural&facialHairColor=Brown&facialHairType=BeardMedium&graphicType=Diamond&hairColor=Brown&hatColor=Black&mouthType=Eating&skinColor=Pale&topType=LongHairCurly",
  "https://avataaars.io/?avatarStyle=Transparent&clotheColor=Red&clotheType=BlazerSweater&eyeType=Squint&eyebrowType=FlatNatural&facialHairColor=Black&facialHairType=BeardMajestic&graphicType=Selena&hairColor=PastelPink&hatColor=Gray01&mouthType=Vomit&skinColor=Brown&topType=Hat",
  "https://avataaars.io/?avatarStyle=Transparent&clotheColor=PastelOrange&clotheType=CollarSweater&eyeType=Side&eyebrowType=UpDownNatural&facialHairColor=Brown&facialHairType=BeardMajestic&graphicType=Diamond&hairColor=PastelPink&hatColor=Blue03&mouthType=Default&skinColor=Tanned&topType=ShortHairDreads01",
  "https://avataaars.io/?avatarStyle=Transparent&clotheColor=Blue01&clotheType=ShirtCrewNeck&eyeType=WinkWacky&eyebrowType=SadConcernedNatural&facialHairColor=Red&facialHairType=MoustacheFancy&graphicType=Deer&hairColor=Brown&hatColor=Pink&mouthType=Sad&skinColor=Yellow&topType=LongHairNotTooLong",
  "https://avataaars.io/?avatarStyle=Transparent&clotheColor=Pink&clotheType=Hoodie&eyeType=Side&eyebrowType=UpDown&facialHairColor=Brown&facialHairType=Blank&graphicType=Pizza&hairColor=BlondeGolden&hatColor=Blue03&mouthType=Grimace&skinColor=Black&topType=LongHairFroBand",
  "https://avataaars.io/?avatarStyle=Transparent&clotheColor=PastelRed&clotheType=Hoodie&eyeType=Happy&eyebrowType=SadConcerned&facialHairColor=BrownDark&facialHairType=MoustacheMagnum&graphicType=Bat&hairColor=BlondeGolden&hatColor=Blue03&mouthType=Tongue&skinColor=Black&topType=LongHairNotTooLong",
  "https://avataaars.io/?avatarStyle=Transparent&clotheColor=Black&clotheType=ShirtVNeck&eyeType=Close&eyebrowType=UnibrowNatural&facialHairColor=Brown&facialHairType=MoustacheMagnum&graphicType=Selena&hairColor=Red&hatColor=Blue03&mouthType=Smile&skinColor=Light&topType=ShortHairShortFlat",
  "https://avataaars.io/?avatarStyle=Transparent&clotheColor=Black&clotheType=ShirtCrewNeck&eyeType=Hearts&eyebrowType=UnibrowNatural&facialHairColor=BrownDark&facialHairType=BeardLight&graphicType=Skull&hairColor=Red&hatColor=Heather&mouthType=Tongue&skinColor=DarkBrown&topType=Eyepatch",
];

export default Profile;
