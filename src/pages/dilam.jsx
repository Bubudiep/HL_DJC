import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "zmp-sdk";
import moment from "moment";

const Dilam = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState(""); // Trạng thái để lưu thông báo
  const location = useLocation(); // Lấy state từ navigate
  const [user, setUser] = useState(location.state?.user); // Thông tin người dùng
  const [buttonText, setButtonText] = useState("Quét mã QR");
  const [retryCount, setRetryCount] = useState(0); // Đếm số lần thử lại
  const [usersList, setUsersList] = useState([]); // Danh sách người dùng đi làm
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]); // Ngày mặc định là hôm nay

  // Lấy thông tin người dùng khi component được mount
  useEffect(() => {
    console.log(user);
  }, []); // Chạy 1 lần khi component mount

  const handleScan = () => {
    sendGetAPI("V000930"); // Gửi lệnh GET API với mã nhân viên
    return;

    api.requestCameraPermission({
      success: ({ userAllow }) => {
        if (userAllow) {
          api.scanQRCode({
            success: (data) => {
              const { content } = data;
              if (content) {
                const parts = content.split("|");

                // Kiểm tra nếu định dạng đúng là "HoanglongDJC|manhanvien|nguoituyen"
                if (parts.length === 3 && parts[0] === "HoanglongDJC") {
                  const manhanvien = parts[1]; // Lấy mã nhân viên
                  sendGetAPI(manhanvien); // Gửi lệnh GET API với mã nhân viên

                  setButtonText("Quét mã QR");
                  setRetryCount(0); // Reset lại đếm số lần thử
                } else {
                  console.log("Mã không hợp lệ:", content);
                  setButtonText(`Thử lại (${retryCount + 1})`);
                  setRetryCount((prev) => prev + 1); // Tăng đếm số lần thử lại
                }
              } else {
                // Nếu không có content thì đổi nút thành "Thử lại"
                setButtonText(`Thử lại (${retryCount + 1})`);
                setRetryCount((prev) => prev + 1); // Tăng đếm số lần thử lại
              }
            },
            fail: () => {
              // Nếu quét thất bại cũng đổi nút thành "Thử lại"
              setButtonText(`Thử lại (${retryCount + 1})`);
              setRetryCount((prev) => prev + 1); // Tăng đếm số lần thử lại
            },
          });
        }
      },
      fail: () => {
        // Nếu yêu cầu quyền thất bại thì đổi nút thành "Thử lại"
        setButtonText(`Thử lại (${retryCount + 1})`);
        setRetryCount((prev) => prev + 1); // Tăng đếm số lần thử lại
      },
    });
  };

  const sendGetAPI = (manhanvien) => {
    const url = `http://localhost:5005/api/dilam/?chamcongdi=true&congty=HoanglongDJC&manhanvien=${manhanvien}&ngaylam=${date}&from=zalo`;

    fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user?.app?.access_token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Kết quả API:", data);
        if (data) {
          const existingUserIndex = usersList.findIndex(
            (u) => u.manhanvien.manhanvien === data.manhanvien.manhanvien
          );

          if (existingUserIndex !== -1) {
            setMessage(
              "Đã quét mã " + data?.manhanvien?.manhanvien + " trước đó."
            ); // Cập nhật thông báo
            setUsersList((prevList) => {
              const newList = [...prevList];
              newList.splice(existingUserIndex, 1); // Xóa người dùng cũ
              return newList;
            });
          } else {
            setMessage(""); // Reset thông báo nếu mã mới
          }

          // Thêm người dùng mới vào danh sách
          setUsersList((prevList) => [...prevList, data]);
          console.log(usersList);
        }
      })
      .catch((error) => {
        console.error("Lỗi khi gọi API:", error);
      });
  };

  return (
    <div className="full-page">
      <div className="top-container">
        <div className="left">
          <button
            onClick={() => {
              navigate(-1);
            }}
          >
            Quay lại
          </button>
        </div>
        <div className="right">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)} // Cập nhật giá trị ngày
          />
        </div>
      </div>
      <div className="action-tools">
        <button onClick={handleScan}>{buttonText}</button>
      </div>
      <div className="message">
        {message && <p>{message}</p>} {/* Hiển thị thông báo nếu có */}
      </div>
      <div className="history">
        <div className="bar-top">
          <div className="bar"></div>
        </div>
        <div className="title">
          Danh sách đi làm <div className="count">{usersList.length}</div>
        </div>
        <div className="list_data">
          <table>
            <tbody>
              {/* Danh sách đi làm */}
              {usersList.reverse().map((user, index) => (
                <tr key={index}>
                  <td className="id">{usersList.length - index}</td>
                  <td className="date">{user?.manhanvien?.manhanvien}</td>
                  <td className="user">{user?.manhanvien?.HovaTen}</td>
                  <td className="time">
                    {moment(user?.created_at).format("YYYY-MM-DD HH:mm")}
                  </td>
                </tr>
              ))}
              {/* Các hàng khác */}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dilam;