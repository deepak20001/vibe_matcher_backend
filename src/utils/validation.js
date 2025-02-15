const validator = require("validator");

const ValidateSignUpData = (req) => {
    const {
        name, 
        email, 
        password, 
        address, 
        dob,
        gender, 
        selectedInterests, 
        profilePhotos,
    } = req.body;

    if(!name || name.length < 3 || name.length > 20) {
        throw new Error("Invalid name");
    } else if(!email || !validator.isEmail(email)) {
        throw new Error("Invalid email");
    } else if(password.length < 8) {
        throw new Error("Weak password");
    } else if(!address) {
        throw new Error("Invalid address");
    } 
    // Age validation
    const birthDate = new Date(dob);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    else if (age < 18) {
        throw new Error("Must be at least 18 years old");
    }
    else if (!gender || !["male", "female", "other"].includes(gender.toLowerCase())) {
        throw new Error("Invalid gender");
    } else if (!selectedInterests || !Array.isArray(selectedInterests) || selectedInterests.length === 0) {
        throw new Error("Please select at least one interest");
    } else if (!profilePhotos || !Array.isArray(profilePhotos) || profilePhotos.length !== 3) {
        throw new Error("Please upload all 3 profile photos");
    }
}


const ValidateUpdateProfileData = (req) => {
    const {
        name, 
        address, 
        dob,
        gender, 
        profilePhotos,
    } = req.body;

    if(!name || name.length < 3 || name.length > 20) {
        throw new Error("Invalid name");
    }  else if(!address) {
        throw new Error("Invalid address");
    } 
    // Age validation
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    else if (age < 18) {
        throw new Error("Must be at least 18 years old");
    }
    else if (!gender || !["male", "female", "other"].includes(gender.toLowerCase())) {
        throw new Error("Invalid gender");
    } else if (!profilePhotos || !Array.isArray(profilePhotos) || profilePhotos.length !== 3) {
        throw new Error("Please upload all 3 profile photos");
    }
}


module.exports = {
    ValidateSignUpData,
    ValidateUpdateProfileData,
};