import React, { useState } from "react";
import { Avatar, Box, Text } from "zmp-ui";
import { useRecoilValue } from "recoil";
import { userState } from "../state";
import { authorize, getUserInfo } from "zmp-sdk";

const UserCard = ({ onUserUpdate }) => {
  // const { userInfo } = useRecoilValue(userState);
  const [userInfo, setUserInfo] = useState(useRecoilValue(userState).userInfo);

  const handleCapquyen = () => {
    authorize({
      scopes: ["scope.userInfo"],
      success: (data) => {
        getUserInfo({
          success: (data) => {
            setUserInfo(data.userInfo);
            if (onUserUpdate) {
              onUserUpdate(data); // Gọi callback để cập nhật thông tin người dùng
            }
          },
          fail: (error) => {
            // xử lý khi gọi api thất bại
            console.log(error);
          },
        });
      },
      fail: (error) => {
        console.log(error);
      },
    });
  };
  return userInfo?.avatar ? (
    <Box flex>
      <Avatar
        story="default"
        online
        src={userInfo.avatar.startsWith("http") ? userInfo.avatar : undefined}
      >
        {userInfo.avatar}
      </Avatar>
      <Box ml={4}>
        <Text.Title>{userInfo.name}</Text.Title>
        <Text>{userInfo.id}</Text>
      </Box>
    </Box>
  ) : (
    <div className="capquyen" onClick={handleCapquyen}>
      Cho phép truy cập avatar và tên
    </div>
  );
};

export default UserCard;
