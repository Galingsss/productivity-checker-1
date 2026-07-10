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
    <div className="bg-white rounded-xl shadow-xs border border-slate-100 flex flex-col">
      {/* Card Header */}
      <div className="pt-5 pb-3 px-5 flex flex-col items-center">
        <h3 className="text-slate-800 font-extrabold text-base tracking-wider uppercase text-center">
          {title}
        </h3>
        {/* Blue decorative bar */}
        <div className="w-full h-[3px] bg-blue-600 rounded-full mt-2.5 mb-1.5" />
        <span className="text-sm text-slate-400 font-bold tracking-wide uppercase">
          {targetText}
        </span>
      </div>

      {/* Card Content - Table */}
      <div className="px-5 pb-5">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="py-2.5 text-xs font-extrabold text-slate-800 tracking-wider text-left w-[58%]">
                NAMA
              </th>
              <th className="py-2.5 text-xs font-extrabold text-slate-800 tracking-wider text-right w-[12%]">
                SO
              </th>
              <th className="py-2.5 text-xs font-extrabold text-slate-800 tracking-wider text-center w-[15%]">
                SKU
              </th>
              <th className="py-2.5 text-xs font-extrabold text-slate-800 tracking-wider text-right w-[15%]">
                QTY
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {records.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-sm text-slate-400 font-medium">
                  Tidak ada data checker
                </td>
              </tr>
            ) : (
              records.map((record, index) => {
                // Determine badge color based on threshold
                const meetsTarget = record.sku >= threshold;
                const badgeColor = meetsTarget
                  ? "bg-green-50 text-green-700 border border-green-200/60"
                  : "bg-red-50 text-red-600 border border-red-200/60";

                return (
                  <tr
                    key={index}
                    className="hover:bg-slate-50/70 transition-colors duration-150"
                  >
                    {/* Name */}
                    <td className="py-2.5 pr-2 w-[58%] align-middle">
                      <div className="relative group">
                        <p
                          className="text-[13px] font-extrabold text-slate-700 truncate max-w-[130px] sm:max-w-[160px] md:max-w-[120px] lg:max-w-[140px] xl:max-w-[180px]"
                          title={record.nama}
                        >
                          {record.nama}
                        </p>
                        {/* Custom tooltip on hover for long names */}
                        <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block z-10 bg-slate-800 text-white text-[11px] py-1 px-2 rounded shadow-md whitespace-nowrap">
                          {record.nama}
                        </div>
                      </div>
                    </td>

                    {/* SO */}
                    <td className="py-2.5 text-right text-[13px] font-extrabold text-slate-700 align-middle">
                      {record.so}
                    </td>

                    {/* SKU */}
                    <td className="py-2 text-center align-middle">
                      <span
                        className={`inline-block px-2 py-0.5 text-[11px] font-black rounded-md w-[50px] text-center ${badgeColor}`}
                      >
                        {record.sku}
                      </span>
                    </td>

                    {/* QTY */}
                    <td className="py-2.5 text-right text-[13px] font-extrabold text-slate-600 align-middle">
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
