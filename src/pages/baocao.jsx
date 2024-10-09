import moment from "moment";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const calculateWorkingHours = (giovao, giora) => {
  const format = "HH:mm"; // Định dạng giờ
  const startWork = moment("08:00", format); // Giờ bắt đầu làm hành chính
  const endWork = moment("17:00", format); // Giờ kết thúc làm hành chính
  const lunchBreakStart = moment("12:00", format); // Giờ bắt đầu nghỉ trưa
  const lunchBreakEnd = moment("13:00", format); // Giờ kết thúc nghỉ trưa
  const midnightBreakStart = moment("00:00", format); // Giờ bắt đầu nghỉ đêm
  const midnightBreakEnd = moment("01:00", format); // Giờ kết thúc nghỉ đêm

  let gioVaoMoment = moment(giovao);
  let gioRaMoment = moment(giora);

  let workingHours = 0; // Tổng số giờ làm hành chính
  let overtimeHours = 0; // Tổng số giờ tăng ca
  let totalBreakTime = 0; // Tổng thời gian nghỉ

  // Tính giờ làm hành chính
  console.log(gioVaoMoment, gioVaoMoment.isBefore(endWork), gioRaMoment);
  if (gioVaoMoment.isBefore(endWork) && gioRaMoment.isAfter(startWork)) {
    let workStart = moment.max(gioVaoMoment, startWork);
    let workEnd = moment.min(gioRaMoment, endWork);

    // Tính thời gian nghỉ trưa
    if (workStart.isBefore(lunchBreakEnd) && workEnd.isAfter(lunchBreakStart)) {
      let breakStart = moment.max(workStart, lunchBreakStart);
      let breakEnd = moment.min(workEnd, lunchBreakEnd);
      if (breakEnd.isAfter(breakStart)) {
        totalBreakTime +=
          moment.duration(breakEnd.diff(breakStart)).asMinutes() / 60; // Tính thời gian nghỉ trưa
      }
    }

    // Tính thời gian nghỉ đêm
    if (
      workStart.isBefore(midnightBreakEnd) &&
      workEnd.isAfter(midnightBreakStart)
    ) {
      let breakStart = moment.max(workStart, midnightBreakStart);
      let breakEnd = moment.min(workEnd, midnightBreakEnd);
      if (breakEnd.isAfter(breakStart)) {
        totalBreakTime +=
          moment.duration(breakEnd.diff(breakStart)).asMinutes() / 60; // Tính thời gian nghỉ đêm
      }
    }

    // Tính giờ làm việc
    console.log(workStart, workEnd);
    workingHours = moment.duration(workEnd.diff(workStart)).asMinutes() / 60; // Tính phút và chia cho 60 để được giờ
  }

  // Tính giờ tăng ca ngoài khung hành chính
  if (gioRaMoment.isAfter(endWork)) {
    overtimeHours +=
      moment
        .duration(gioRaMoment.diff(moment.max(endWork, gioVaoMoment)))
        .asMinutes() / 60; // Tính phút và chia cho 60 để được giờ
  }

  // Làm tròn giờ thành khối 30 phút
  const roundToHalfHour = (hours) => {
    return Math.floor(hours * 2) / 2; // Làm tròn xuống đến 0.5
  };
  return {
    workingHours: roundToHalfHour(workingHours), // Làm tròn đến khối 30 phút
    overtimeHours: roundToHalfHour(overtimeHours), // Làm tròn đến khối 30 phút
    totalBreakTime: roundToHalfHour(totalBreakTime), // Trả về tổng thời gian nghỉ
  };
};

const Baocao = () => {
  const location = useLocation(); // Lấy state từ navigate
  const [user, setUser] = useState(location.state?.user); // Thông tin người dùng
  const navigate = useNavigate();
  const [usersList, setUsersList] = useState([]); // Danh sách người dùng đi làm
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]); // Ngày mặc định là hôm nay
  // Tính toán tổng số người đi làm, giờ hành chính và giờ tăng ca
  const totalBreakingHours = usersList.reduce(
    (total, user) => total + user.break,
    0
  );
  const totalWorkingHours = usersList.reduce(
    (total, user) => total + user.hc,
    0
  );
  const totalOvertimeHours = usersList.reduce(
    (total, user) => total + user.tc,
    0
  );
  const totalEmployees = usersList.length;
  // Lấy thông tin người dùng khi component được mount
  useEffect(() => {
    const url = `http://localhost:5005/api/danhsachdilam/?ngaydilam=${date}&page_size=999`;
    fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user?.app?.access_token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        // Lọc trùng và chọn object có giochamcong lớn nhất
        const uniqueUsers = Object.values(
          data.results.reduce((acc, curr) => {
            const key = `${curr.manhanvien.manhanvien}-${curr.chamcongdi}`; // Kết hợp manhanvien và chamcongdi làm key

            // Nếu chưa có key này hoặc curr có giochamcong lớn hơn
            if (curr.chamcongdi) {
              if (
                !acc[key] ||
                new Date(curr.giochamcong) > new Date(acc[key].giochamcong)
              ) {
                acc[key] = curr; // Thay thế bằng object có giochamcong lớn hơn
              }
            } else {
              if (
                !acc[key] ||
                new Date(curr.giochamcong) < new Date(acc[key].giochamcong)
              ) {
                acc[key] = curr; // Thay thế bằng object có giochamcong lớn hơn
              }
            }

            return acc;
          }, {})
        );
        const groupedUsers = Object.values(
          uniqueUsers.reduce((acc, curr) => {
            const manhanvien = curr.manhanvien.manhanvien;

            if (!acc[manhanvien]) {
              acc[manhanvien] = {
                manhanvien: curr.manhanvien.manhanvien,
                HovaTen: curr.manhanvien.HovaTen,
                nguoituyen: curr.manhanvien.nguoituyen,
                ngaydilam: curr.ngaydilam,
                giovao: null, // Giờ vào làm
                giora: null, // Giờ tan làm
                hc: 0, // Giờ tan làm
                tc: 0, // Giờ tan làm
              };
            }

            // Nếu chamcongdi là true, đó là giờ vào làm
            if (curr.chamcongdi) {
              acc[manhanvien].giovao = curr.giochamcong;
            }
            // Nếu chamcongdi là false, đó là giờ tan làm
            else {
              acc[manhanvien].giora = curr.giochamcong;
            }
            const { workingHours, overtimeHours, totalBreakTime } =
              calculateWorkingHours(
                acc[manhanvien].giovao,
                acc[manhanvien].giora
              );
            acc[manhanvien]["break"] = totalBreakTime;
            acc[manhanvien]["hc"] = workingHours;
            acc[manhanvien]["tc"] = overtimeHours;
            return acc;
          }, {})
        );

        console.log(uniqueUsers, groupedUsers);
        setUsersList((prevList) => [
          ...prevList,
          ...groupedUsers.reverse(), // Thêm các phần tử mới từ API
        ]);
      })
      .catch((error) => {
        console.error("Lỗi khi gọi API:", error);
      });
  }, []); // Chạy 1 lần khi component mount
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
      <div className="all-dashboard">
        <div className="items">
          <div className="name">Nhân lực</div>
          <div className="details">
            <div className="value">{totalEmployees}</div>{" "}
            {/* Tổng số người đi làm */}
            <div className="unit">người</div>
          </div>
        </div>
        <div className="items">
          <div className="name">Giờ hành chính</div>
          <div className="details">
            <div className="value">
              {(totalWorkingHours - totalBreakingHours).toFixed(2)}
            </div>{" "}
            {/* Tổng giờ hành chính */}
            <div className="unit">giờ</div>
          </div>
        </div>
        <div className="items">
          <div className="name">Tăng ca</div>
          <div className="details">
            <div className="value">{totalOvertimeHours.toFixed(2)}</div>{" "}
            {/* Tổng giờ tăng ca */}
            <div className="unit">giờ</div>
          </div>
        </div>
      </div>
      <div className="all-record">
        <div className="bar-top">
          <div className="bar"></div>
        </div>
        <div className="list_data">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Mã NV</th>
                <th>Họ và Tên</th>
                <th>HC</th>
                <th>TC</th>
                <th>Giờ</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map((user, index) => {
                return (
                  <tr key={index}>
                    <td className="id">{usersList.length - index}</td>
                    <td className="date">{user?.manhanvien}</td>
                    <td className="user">{user?.HovaTen}</td>
                    <td className="time">{user?.hc - user?.break}</td>
                    <td className="time">{user?.tc}</td>
                    <td className="time">
                      <div className="flex gap-1 items-center">
                        {moment(user?.giovao).format("HH:mm")}
                        <i className="mt-1 fa-solid fa-arrow-right-long"></i>
                        {moment(user?.giora).format("HH:mm")}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Baocao;
