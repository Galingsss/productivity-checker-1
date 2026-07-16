import React from "react";
import { CheckerRecord } from "../types";

interface CheckerCardProps {
  title: string;
  records: CheckerRecord[];
  isMonthly?: boolean;
  targetText: string;
  threshold: number;
}

export const CheckerCard: React.FC<CheckerCardProps> = ({
  title,
  records,
  isMonthly = false,
  targetText,
  threshold,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 flex flex-col">
      {/* Card Header */}
      <div className="pt-6 pb-4 px-5 flex flex-col items-center">
        <h3 className="text-black font-black text-lg md:text-xl tracking-wider uppercase text-center">
          {title}
        </h3>
        {/* Blue decorative bar */}
        <div className="w-full h-[4px] bg-blue-600 rounded-full mt-2.5 mb-1.5" />
        <span className="text-sm md:text-base text-black font-black tracking-wide uppercase">
          {targetText}
        </span>
      </div>

      {/* Card Content - Table */}
      <div className="px-5 pb-5">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="border-b-2 border-slate-300">
              <th className="py-3 text-sm md:text-base font-black text-black tracking-wider text-left w-[36%]">
                NAMA
              </th>
              <th className="py-3 text-sm md:text-base font-black text-black tracking-wider text-right w-[22%] pr-6">
                SO
              </th>
              <th className="py-3 text-sm md:text-base font-black text-black tracking-wider text-center w-[24%]">
                SKU
              </th>
              <th className="py-3 text-sm md:text-base font-black text-black tracking-wider text-right w-[18%]">
                QTY
              </th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-slate-100">
            {records.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-10 text-center text-sm md:text-base text-black font-black">
                  Tidak ada data checker
                </td>
              </tr>
            ) : (
              records.map((record, index) => {
                // Determine badge color based on threshold
                const meetsTarget = record.sku >= threshold;
                const badgeColor = meetsTarget
                  ? "bg-green-100 text-black border-2 border-green-500 font-black"
                  : "bg-red-100 text-black border-2 border-red-500 font-black";

                return (
                  <tr
                    key={index}
                    className="hover:bg-slate-50 transition-colors duration-150"
                  >
                    {/* Name */}
                    <td className="py-3.5 pr-2 w-[36%] align-middle overflow-hidden">
                      <div className="relative group">
                        <p
                          className="text-sm md:text-base font-black text-black truncate w-full"
                          title={record.nama}
                        >
                          {record.nama}
                        </p>
                        {/* Custom tooltip on hover for long names */}
                        <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block z-10 bg-slate-800 text-white text-[12px] py-1.5 px-2.5 rounded shadow-md whitespace-nowrap font-bold">
                          {record.nama}
                        </div>
                      </div>
                    </td>

                    {/* SO */}
                    <td className="py-3.5 text-right text-sm md:text-base font-black text-black align-middle pr-6">
                      {record.so}
                    </td>

                    {/* SKU */}
                    <td className="py-3 text-center align-middle">
                      <span
                        className={`inline-block px-2.5 py-1 text-base md:text-lg lg:text-xl font-black rounded-lg w-[70px] md:w-[85px] text-center ${badgeColor}`}
                      >
                        {record.sku}
                      </span>
                    </td>

                    {/* QTY */}
                    <td className="py-3.5 text-right text-sm md:text-base font-black text-black align-middle">
                      {record.qty.toLocaleString("id-ID")}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
